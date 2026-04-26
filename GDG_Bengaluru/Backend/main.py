"""
AgriLens Backend — FastAPI Server v2.0
══════════════════════════════════════
4 Gemini API keys, NLP processing, voice search, context optimization.
"""

import os, json, asyncio, logging, base64
from datetime import datetime
from typing import Optional, List

import httpx
from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

import auth_db

from knowledge_cache import (
    response_cache, SCHEMA_CROP_ANALYSIS, SCHEMA_IRRIGATION, SCHEMA_CROP_PROFILE,
    FIELD_MAP_ANALYSIS, FIELD_MAP_IRRIGATION, FIELD_MAP_PROFILE,
    expand_keys, compress_weather_data, prune_chat_context,
    COMPRESSED_SYSTEM_PROMPT, get_crop_context, estimate_tokens,
)
from nlp_processor import (
    detect_intent, extract_entities, build_smart_prompt,
    get_season_from_month, get_regional_crops,
)
from voice_processor import transcribe_audio, SUPPORTED_LANGUAGES

load_dotenv()

# ── 4 API Keys (Load Balanced) ──────────────────────────────────────────────────
KEY_CROP_ADVISORY = os.getenv("GEMINI_KEY_CROP_ADVISORY", "")
KEY_CHATBOT       = os.getenv("GEMINI_KEY_CHATBOT", "")
KEY_IMPROVEMENT   = os.getenv("GEMINI_KEY_IMPROVEMENT", "")
KEY_GENERAL       = os.getenv("GEMINI_KEY_GENERAL", "")
GNEWS_API_KEY     = os.getenv("GNEWS_API_KEY", "")
PIXABAY_API_KEY   = os.getenv("PIXABAY_API_KEY_VALID", "")

GEMINI_POOL = [k for k in [KEY_CROP_ADVISORY, KEY_CHATBOT, KEY_IMPROVEMENT, KEY_GENERAL] if k]

def _gemini_url(key: str = None, model: str = "gemini-2.5-flash-lite") -> str:
    import random
    active_key = random.choice(GEMINI_POOL) if GEMINI_POOL else key
    return f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={active_key}"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("agrilens")

app = FastAPI(title="AgriLens API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# ── Utils ──────────────────────────────────────────────────────────────────────
LANG_MAP = {"en": "English", "hi": "Hindi", "kn": "Kannada"}

# ── Models ────────────────────────────────────────────────────────────────────
class AnalyzeCropRequest(BaseModel):
    base64_image: str
    mime_type: str = "image/jpeg"
    language: str = "en"

class IrrigationPlanRequest(BaseModel):
    crop_name: str
    weather_data: dict
    language: str = "en"

class CropProfileRequest(BaseModel):
    crop_name: str
    language: str = "en"

class ChatRequest(BaseModel):
    messages: list
    language: str = "en"

class CropAdvisoryRequest(BaseModel):
    latitude: float
    longitude: float
    state: str = ""
    soil_type: str = ""
    land_size: str = ""

class RegisterRequest(BaseModel):
    name: str
    phone: str
    password: str
    location: str = ""

class LoginRequest(BaseModel):
    phone: str
    password: str

# ── Gemini Helper ─────────────────────────────────────────────────────────────
def _clean_json(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1]
    if cleaned.endswith("```"):
        cleaned = cleaned.rsplit("```", 1)[0]
    return json.loads(cleaned.strip())

async def _gemini_post(url: str, body: dict, max_retries: int = 5) -> dict:
    delay = 1.0
    async with httpx.AsyncClient(timeout=60.0) as client:
        for attempt in range(max_retries + 1):
            try:
                # Force a new randomly selected load-balanced key every retry
                active_url = _gemini_url()
                resp = await client.post(active_url, json=body)
                if resp.status_code in (429, 503) and attempt < max_retries:
                    log.warning("Gemini %s retry %d/%d. Switching keys...", resp.status_code, attempt+1, max_retries)
                    await asyncio.sleep(delay); delay *= 1.5; continue
                if resp.status_code != 200:
                    raise HTTPException(status_code=resp.status_code, detail=f"Gemini error: {resp.text[:300]}")
                data = resp.json()
                text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                if not text:
                    raise HTTPException(status_code=500, detail="Empty Gemini response")
                return _clean_json(text)
            except httpx.RequestError as exc:
                if attempt >= max_retries:
                    raise HTTPException(status_code=503, detail=f"Network error: {exc}")
                await asyncio.sleep(delay); delay *= 2
    raise HTTPException(status_code=503, detail="Gemini unavailable")

async def _gemini_text(url: str, body: dict) -> str:
    """Return raw text (for chatbot, not JSON)."""
    delay = 1.0
    async with httpx.AsyncClient(timeout=60.0) as client:
        for attempt in range(5):
            try:
                active_url = _gemini_url()
                resp = await client.post(active_url, json=body)
                if resp.status_code in (429, 503) and attempt < 4:
                    log.warning("Gemini chat %s retry %d. Switching keys...", resp.status_code, attempt+1)
                    await asyncio.sleep(delay); delay *= 1.5; continue
                if resp.status_code != 200:
                    log.error("Gemini chat error %s: %s", resp.status_code, resp.text[:200])
                    return "I'm having trouble connecting to AI right now. Please try again."
                data = resp.json()
                return data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "Sorry, please try again.")
            except httpx.RequestError as exc:
                if attempt >= 3:
                    return "Connection error. Please check your internet and try again."
                await asyncio.sleep(delay); delay *= 2
    return "Sorry, I could not process that. Please try again."

# ═══════════════════════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0", "cache": response_cache.stats(),
            "timestamp": datetime.utcnow().isoformat()}

# ─── 1. Crop Analysis (KEY_IMPROVEMENT) ──────────────────────────────────────
@app.post("/api/analyze-crop")
async def analyze_crop(req: AnalyzeCropRequest):
    log.info("analyze-crop mime=%s size=%d lang=%s", req.mime_type, len(req.base64_image), req.language)
    target_lang = LANG_MAP.get(req.language, "English")
    prompt = f"Analyze crop image. Return ONLY JSON matching: {SCHEMA_CROP_ANALYSIS}\nMax 2 pesticides, 2 tips. Translate ONLY the VALUES of the JSON into {target_lang}. The JSON KEYS MUST remain strictly in English. Keep token usage extremely low."
    body = {
        "contents": [{"parts": [
            {"text": prompt},
            {"inline_data": {"mime_type": req.mime_type, "data": req.base64_image}},
        ]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 1024,
                             "responseMimeType": "application/json",
                             "thinkingConfig": {"thinkingBudget": 0}},
    }
    result = await _gemini_post(_gemini_url(KEY_IMPROVEMENT), body)
    return expand_keys(result, FIELD_MAP_ANALYSIS)

# ─── 2. Irrigation Plan (KEY_GENERAL) ────────────────────────────────────────
@app.post("/api/irrigation-plan")
async def irrigation_plan(req: IrrigationPlanRequest):
    cache_key = f"irr:{req.crop_name}:{json.dumps(compress_weather_data(req.weather_data))}"
    cached = response_cache.get(cache_key)
    if cached:
        return cached

    context = get_crop_context(req.crop_name)
    weather = json.dumps(compress_weather_data(req.weather_data))
    target_lang = LANG_MAP.get(req.language, "English")
    prompt = f'{"[" + context + "] " if context else ""}7-day irrigation for "{req.crop_name}". Weather:{weather}\nReturn JSON: {SCHEMA_IRRIGATION}\nMax 2 pesticides, 2 tips. Translate ONLY the VALUES into {target_lang}. Keep JSON KEYS in English.'

    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 1024,
                                 "responseMimeType": "application/json",
                                 "thinkingConfig": {"thinkingBudget": 0}}}
    result = await _gemini_post(_gemini_url(KEY_GENERAL), body)
    expanded = expand_keys(result, FIELD_MAP_IRRIGATION)
    response_cache.put(cache_key, expanded)
    return expanded

# ─── 3. Crop Profile (KEY_GENERAL) ───────────────────────────────────────────
@app.post("/api/crop-profile")
async def crop_profile(req: CropProfileRequest):
    cached = response_cache.get(f"profile:{req.crop_name}")
    if cached:
        return cached

    context = get_crop_context(req.crop_name)
    target_lang = LANG_MAP.get(req.language, "English")
    prompt = f'{"[" + context + "] " if context else ""}Profile for "{req.crop_name}". Return JSON: {SCHEMA_CROP_PROFILE}\nMax 3 diseases, 3 pests, 3 tips. Translate ONLY the VALUES into {target_lang}. Keep JSON KEYS in English.'

    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.4, "maxOutputTokens": 1024,
                                 "responseMimeType": "application/json",
                                 "thinkingConfig": {"thinkingBudget": 0}}}
    result = await _gemini_post(_gemini_url(KEY_GENERAL), body)
    expanded = expand_keys(result, FIELD_MAP_PROFILE)
    response_cache.put(f"profile:{req.crop_name}", expanded)
    return expanded

# ─── 4. Chatbot (KEY_CHATBOT) ────────────────────────────────────────────────
@app.post("/api/chat")
async def chat(req: ChatRequest):
    pruned = prune_chat_context(req.messages)
    last_msg = pruned[-1]["text"] if pruned else ""
    intent = detect_intent(last_msg)
    entities = extract_entities(last_msg)

    target_lang = LANG_MAP.get(req.language, "English")
    sys_prompt = f"{COMPRESSED_SYSTEM_PROMPT}\nCRITICAL: You MUST respond entirely in {target_lang}."
    contents = [
        {"role": "user", "parts": [{"text": sys_prompt}]},
        {"role": "model", "parts": [{"text": "Ready to help with farming questions."}]},
        *[{"role": "user" if m.get("role") == "user" else "model",
           "parts": [{"text": m["text"]}]} for m in pruned],
    ]
    body = {"contents": contents,
            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 512,
                                 "thinkingConfig": {"thinkingBudget": 0}}}
    reply = await _gemini_text(_gemini_url(KEY_CHATBOT), body)
    tokens_used = estimate_tokens(json.dumps(contents)) + estimate_tokens(reply)
    return {"reply": reply, "intent": intent, "entities": entities,
            "tokens_estimated": tokens_used}

# ─── 5. Location-Based Crop Advisory (KEY_CROP_ADVISORY) ─────────────────────
@app.post("/api/crop-advisory")
async def crop_advisory(req: CropAdvisoryRequest):
    month = datetime.utcnow().month
    season = get_season_from_month(month)
    state = req.state or "default"
    local_crops = get_regional_crops(state, season)

    cache_key = f"adv:{state}:{season}:{req.soil_type}"
    cached = response_cache.get(cache_key)
    if cached:
        return cached

    prompt = (
        f"Location: {state}, lat={req.latitude:.2f}, lon={req.longitude:.2f}. "
        f"Season: {season}. Soil: {req.soil_type or 'unknown'}. Land: {req.land_size or 'small'}.\n"
        f"Known suitable crops: {', '.join(local_crops[:5])}.\n"
        f"Return ONLY JSON: "
        '{"recommended_crops":[{"name":"","why":"","expected_yield":"","market_demand":"high|med|low",'
        '"water_need":"low|med|high","investment":"low|med|high"}],'
        '"season_tips":[""],"soil_advice":"","best_planting_window":""}\n'
        "Top 5 crops. Be concise."
    )
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.4, "maxOutputTokens": 1024,
                                 "responseMimeType": "application/json",
                                 "thinkingConfig": {"thinkingBudget": 0}}}
    result = await _gemini_post(_gemini_url(KEY_CROP_ADVISORY), body)
    result["season"] = season
    result["state"] = state
    result["local_knowledge"] = local_crops
    response_cache.put(cache_key, result)
    return result

# ─── 6. Voice-to-Text ────────────────────────────────────────────────────────
@app.post("/api/voice-to-text")
async def voice_to_text(
    audio: UploadFile = File(...),
    language: str = Form("en"),
):
    audio_bytes = await audio.read()
    if len(audio_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio file too large (max 10MB)")

    lang_code = SUPPORTED_LANGUAGES.get(language, "en-IN")
    mime = audio.content_type or "audio/wav"

    try:
        text, confidence = transcribe_audio(audio_bytes, mime, lang_code)
        if not text:
            return {"text": "", "confidence": 0, "error": "Speech not recognized"}

        intent = detect_intent(text)
        entities = extract_entities(text)
        return {"text": text, "confidence": confidence, "language": lang_code,
                "intent": intent, "entities": entities}
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── 7. News (no Gemini key needed) ──────────────────────────────────────────
FALLBACK_NEWS = [
    {"title": "New Bio-Pesticide Approved for Organic Farming",
     "description": "A bio-pesticide from neem extract approved for organic farming.",
     "url": "#", "image": "https://images.unsplash.com/photo-1592982537447-6f2ae8c1c5bb?w=800&q=70",
     "publishedAt": datetime.utcnow().isoformat(), "source": {"name": "AgriNews", "url": "#"}},
    {"title": "Drip Irrigation Saves 40% Water",
     "description": "Drip irrigation saves up to 40% water while increasing yields.",
     "url": "#", "image": "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=70",
     "publishedAt": datetime.utcnow().isoformat(), "source": {"name": "WaterWise", "url": "#"}},
    {"title": "AI-Powered Crop Monitoring Gains Traction",
     "description": "AI revolutionizing agriculture with smart disease detection.",
     "url": "#", "image": "https://images.unsplash.com/photo-1625246333195-78d9c38ad849?w=800&q=70",
     "publishedAt": datetime.utcnow().isoformat(), "source": {"name": "TechFarm", "url": "#"}},
]

UNSPLASH_FALLBACKS = [
    "https://images.unsplash.com/photo-1592982537447-6f2ae8c1c5bb?w=800&q=70",
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=70",
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad849?w=800&q=70",
    "https://images.unsplash.com/photo-1563968743333-044cef8528f8?w=800&q=70",
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=70"
]

async def enrich_articles(articles):
    import random
    if PIXABAY_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"https://pixabay.com/api/?key={PIXABAY_API_KEY}&q=agriculture+farming+crop&image_type=photo&per_page=20")
                if resp.status_code == 200:
                    hits = resp.json().get("hits", [])
                    if hits:
                        for article in articles:
                            hit = random.choice(hits)
                            article["image"] = hit["largeImageURL"]
                        return articles
        except Exception as e:
            log.error("Pixabay enrichment error: %s", e)
    
    # If Pixabay fails (e.g. invalid key) or is disabled, use reliable Unsplash fallbacks
    for article in articles:
        article["image"] = random.choice(UNSPLASH_FALLBACKS)
    return articles

NEWSAPI_QUERIES = [
    "agriculture innovation technology",
    "smart farming AI precision agriculture",
    "agritech startup drone farming",
    "crop technology irrigation innovation India",
    "vertical farming sustainable agriculture",
]

@app.get("/api/news")
async def get_news(language: str = "en"):
    import random
    api_key = "77301407f6a1404e819fa39ac9b60bda"
    query = random.choice(NEWSAPI_QUERIES)
    
    # NewsAPI only supports specific languages (ar, de, en, es, fr, he, it, nl, no, pt, ru, sv, ud, zh)
    # Fallback to English if hi/kn isn't perfectly supported by NewsAPI sources, 
    # but we'll try passing it if we want, or we can use gemini to translate the news?
    # Wait, the user said "everything including news and gemini response"
    # Actually, NewsAPI doesn't have good 'hi' or 'kn' support for agriculture. 
    # But let's pass it anyway, or just default to English for NewsAPI but let's pass it to satisfy the requirement if it exists.
    # Wait, actually NewsAPI supports 'hi' for Indian news! But not 'kn'.
    news_lang = language if language in ["ar", "de", "en", "es", "fr", "he", "it", "nl", "no", "pt", "ru", "sv", "zh", "hi"] else "en"

    url = "https://newsapi.org/v2/everything"
    params = {
        "q": query,
        "language": news_lang,
        "sortBy": "publishedAt",
        "pageSize": 6,
    }
    headers = {"X-Api-Key": api_key}
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url, headers=headers, params=params, timeout=8.0)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "ok":
                    raw_results = data.get("articles", [])
                    articles = []
                    for item in raw_results[:6]:
                        # Skip articles that say "[Removed]" (a common NewsAPI quirk)
                        if item.get("title") == "[Removed]":
                            continue
                        articles.append({
                            "title": item.get("title"),
                            "description": item.get("description") or item.get("title"),
                            "url": item.get("url"),
                            "image": item.get("urlToImage"),
                            "publishedAt": item.get("publishedAt"),
                            "source": {"name": item.get("source", {}).get("name")}
                        })
                    if articles:
                        return await enrich_articles(articles)
        except Exception as e:
            log.error("NewsAPI Error: %s", e)
            
    return FALLBACK_NEWS

# ─── 8. Weather ──────────────────────────────────────────────────────────────
@app.get("/api/weather")
async def get_weather(latitude: float = Query(...), longitude: float = Query(...)):
    params = {
        "latitude": latitude, "longitude": longitude,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,windspeed_10m_max,uv_index_max,relative_humidity_2m_mean,et0_fao_evapotranspiration,sunshine_duration,weathercode",
        "hourly": "soil_moisture_0_to_7cm,soil_temperature_0cm",
        "current": "temperature_2m,relative_humidity_2m,weathercode",
        "forecast_days": 7, "timezone": "auto",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get("https://api.open-meteo.com/v1/forecast", params=params)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="Weather API error")
    data = resp.json()
    # Compute daily soil averages
    hourly_time = data.get("hourly", {}).get("time", [])
    sm = data.get("hourly", {}).get("soil_moisture_0_to_7cm", [])
    st = data.get("hourly", {}).get("soil_temperature_0cm", [])
    dm = {}
    for i, t in enumerate(hourly_time):
        d = t.split("T")[0]
        dm.setdefault(d, {"m": [], "t": []})
        if i < len(sm) and sm[i] is not None: dm[d]["m"].append(sm[i])
        if i < len(st) and st[i] is not None: dm[d]["t"].append(st[i])
    ds = sorted(dm.keys())
    avg = lambda l: sum(l)/len(l) if l else None
    data["daily_soil"] = {"dates": ds, "soil_moisture_avg": [avg(dm[d]["m"]) for d in ds],
                          "soil_temp_avg": [avg(dm[d]["t"]) for d in ds]}
    return data

# ─── 9. Reverse Geocode ──────────────────────────────────────────────────────
@app.get("/api/weather/geocode")
async def reverse_geocode(latitude: float = Query(...), longitude: float = Query(...)):
    url = f"https://nominatim.openstreetmap.org/reverse?lat={latitude}&lon={longitude}&format=json&addressdetails=1&zoom=12"
    async with httpx.AsyncClient(timeout=8.0) as client:
        resp = await client.get(url, headers={"User-Agent": "AgriLens/1.0"})
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="Geocode error")
    addr = resp.json().get("address", {})
    name = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("state") or "Unknown"
    return {"name": name, "state": addr.get("state", ""), "country": addr.get("country", ""),
            "full": f"{name}{', ' + addr['state'] if addr.get('state') else ''}"}

# ─── 10. Cache Stats ─────────────────────────────────────────────────────────
@app.get("/api/cache/stats")
async def cache_stats():
    return response_cache.stats()

# ─── 11. Authentication ──────────────────────────────────────────────────────
@app.post("/api/auth/register")
async def auth_register(req: RegisterRequest):
    try:
        profile = {
            "name": req.name,
            "phone": req.phone,
            "location": req.location,
            "currentCrop": None,
            "scanHistory": [],
            "createdAt": datetime.utcnow().isoformat()
        }
        user_profile, token = auth_db.create_user(req.phone, req.password, profile)
        return {"status": "ok", "profile": user_profile, "token": token}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        log.error("Register Error: %s", e)
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/api/auth/login")
async def auth_login(req: LoginRequest):
    try:
        user_profile, token = auth_db.verify_user(req.phone, req.password)
        if not user_profile:
            raise HTTPException(status_code=401, detail="Invalid phone number or password")
        return {"status": "ok", "profile": user_profile, "token": token}
    except HTTPException:
        raise
    except Exception as e:
        log.error("Login Error: %s", e)
        raise HTTPException(status_code=500, detail="Login failed")

@app.get("/api/auth/me")
async def auth_me(authorization: str = Header(None)):
    token = authorization.split("Bearer ")[1] if authorization and authorization.startswith("Bearer ") else None
    if not token:
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    profile = auth_db.get_user_by_token(token)
    if not profile:
        raise HTTPException(status_code=401, detail="Session expired")
    return {"status": "ok", "profile": profile}

class ProfileUpdateRequest(BaseModel):
    profile: dict

@app.post("/api/auth/update")
async def auth_update(req: ProfileUpdateRequest, authorization: str = Header(None)):
    token = authorization.split("Bearer ")[1] if authorization and authorization.startswith("Bearer ") else None
    if not token:
        raise HTTPException(status_code=401, detail="Missing or invalid token")
        
    profile = auth_db.get_user_by_token(token)
    if not profile:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        auth_db.update_user_profile(token, req.profile)
        return {"status": "ok"}
    except Exception as e:
        log.error("Update Profile Error: %s", e)
        raise HTTPException(status_code=500, detail="Update failed")
