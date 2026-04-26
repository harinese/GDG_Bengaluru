"""
nlp_processor.py — Natural Language Processing for AgriLens
════════════════════════════════════════════════════════════
Uses spaCy for:
  - Intent detection (what does the user want?)
  - Entity extraction (crop names, locations, diseases)
  - Query keyword extraction for smarter Gemini prompts

Falls back to regex-based extraction if spaCy model is not available.
"""

import re
import logging
from typing import Dict, List, Optional

log = logging.getLogger("agrilens.nlp")

# ── Try loading spaCy ─────────────────────────────────────────────────────────
_nlp = None
try:
    import spacy
    try:
        _nlp = spacy.load("en_core_web_sm")
        log.info("spaCy en_core_web_sm loaded")
    except OSError:
        log.warning("spaCy model 'en_core_web_sm' not found — using regex fallback")
except ImportError:
    log.warning("spaCy not installed — using regex fallback")


# ═══════════════════════════════════════════════════════════════════════════════
# Intent Detection
# ═══════════════════════════════════════════════════════════════════════════════

INTENT_PATTERNS = {
    "crop_advisory": [
        r"\b(what|which)\s+(crop|plant|seed)\b", r"\b(best|suitable|recommend)\b.*\b(crop|plant)\b",
        r"\b(grow|cultivate|sow|plant)\b.*\b(in|for|during)\b",
        r"\b(kharif|rabi|zaid|summer|winter|monsoon)\b.*\b(crop|plant|season)\b",
        r"\b(advisory|advice|suggest)\b.*\b(crop|farm)\b",
    ],
    "disease_query": [
        r"\b(disease|blight|wilt|rot|rust|mildew|leaf\s?spot|curl)\b",
        r"\b(treatment|treat|cure|remedy|control)\b.*\b(disease|pest|infection)\b",
        r"\b(yellow|brown|black|white)\s*(spot|leaf|leaves|patch)\b",
        r"\b(dying|wilting|drooping|drying)\b",
    ],
    "pest_query": [
        r"\b(pest|insect|bug|worm|borer|aphid|whitefly|mite|caterpillar)\b",
        r"\b(pesticide|insecticide|spray)\b",
    ],
    "irrigation_query": [
        r"\b(irrigat|water|drip|sprinkler|flood)\b",
        r"\b(how\s+much\s+water|when\s+to\s+water)\b",
    ],
    "fertilizer_query": [
        r"\b(fertiliz|manure|compost|npk|urea|dap|potash|organic\s+feed)\b",
        r"\b(nutrient|nitrogen|phosphorus|potassium)\b",
    ],
    "weather_query": [
        r"\b(weather|rain|temperature|humidity|forecast|climate)\b",
        r"\b(monsoon|drought|flood|frost|heatwave)\b",
    ],
    "greeting": [
        r"\b(hi|hello|hey|namaste|namaskar|good\s+(morning|afternoon|evening))\b",
    ],
}


def detect_intent(text: str) -> str:
    """Detect the primary intent from user text."""
    text_lower = text.lower().strip()

    scores: Dict[str, int] = {}
    for intent, patterns in INTENT_PATTERNS.items():
        score = sum(1 for p in patterns if re.search(p, text_lower, re.IGNORECASE))
        if score > 0:
            scores[intent] = score

    if not scores:
        return "general"

    return max(scores, key=scores.get)


# ═══════════════════════════════════════════════════════════════════════════════
# Entity Extraction
# ═══════════════════════════════════════════════════════════════════════════════

CROP_NAMES = {
    "rice", "wheat", "tomato", "cotton", "sugarcane", "maize", "corn",
    "potato", "onion", "soybean", "groundnut", "peanut", "chickpea", "chana",
    "mustard", "banana", "mango", "chili", "chilli", "pepper", "turmeric",
    "coconut", "tea", "coffee", "jute", "grape", "papaya", "watermelon",
    "brinjal", "eggplant", "okra", "ladyfinger", "cabbage", "cauliflower",
    "carrot", "spinach", "palak", "radish", "cucumber", "pumpkin",
    "lemon", "orange", "apple", "guava", "pomegranate", "litchi",
    "paddy", "bajra", "jowar", "ragi", "sorghum", "millet",
}

DISEASE_NAMES = {
    "blight", "wilt", "rust", "rot", "mildew", "smut", "scab",
    "anthracnose", "canker", "mosaic", "leaf spot", "leaf curl",
    "downy mildew", "powdery mildew", "damping off", "ring spot",
    "black rot", "brown spot", "bacterial wilt", "fusarium",
    "late blight", "early blight", "stem rot", "root rot",
    "sheath blight", "blast", "tikka",
}

LOCATION_WORDS = {
    "karnataka", "bengaluru", "bangalore", "mysore", "hubli",
    "maharashtra", "mumbai", "pune", "nagpur",
    "tamil nadu", "chennai", "coimbatore",
    "kerala", "kochi", "trivandrum",
    "andhra pradesh", "hyderabad", "telangana",
    "punjab", "haryana", "uttar pradesh", "bihar",
    "rajasthan", "gujarat", "madhya pradesh",
    "west bengal", "kolkata", "odisha", "assam",
    "india", "south india", "north india",
}


def extract_entities(text: str) -> Dict[str, List[str]]:
    """Extract crop names, diseases, locations, and numbers from text."""
    text_lower = text.lower()
    entities: Dict[str, List[str]] = {
        "crops": [],
        "diseases": [],
        "locations": [],
        "numbers": [],
    }

    # Regex-based extraction (always available)
    for crop in CROP_NAMES:
        if re.search(rf'\b{re.escape(crop)}\b', text_lower):
            entities["crops"].append(crop.title())

    for disease in DISEASE_NAMES:
        if disease in text_lower:
            entities["diseases"].append(disease.title())

    for loc in LOCATION_WORDS:
        if loc in text_lower:
            entities["locations"].append(loc.title())

    # Extract numbers (e.g., "25°C", "100mm", "5 acres")
    numbers = re.findall(r'\b(\d+(?:\.\d+)?)\s*(?:°?[cCfF]|mm|cm|kg|acres?|hectares?|liters?|ml)?\b', text)
    entities["numbers"] = numbers[:5]  # cap at 5

    # spaCy NER (if available) — enriches with GPE, ORG, etc.
    if _nlp:
        doc = _nlp(text)
        for ent in doc.ents:
            if ent.label_ in ("GPE", "LOC") and ent.text.title() not in entities["locations"]:
                entities["locations"].append(ent.text.title())

    # Deduplicate
    for key in entities:
        entities[key] = list(dict.fromkeys(entities[key]))

    return entities


# ═══════════════════════════════════════════════════════════════════════════════
# Smart Query Builder — Reduces prompt tokens
# ═══════════════════════════════════════════════════════════════════════════════

def build_smart_prompt(user_text: str, intent: str, entities: Dict) -> str:
    """
    Build a focused, token-efficient prompt based on detected intent.
    Instead of a generic "answer everything" prompt, this sends only
    what's relevant — saving 30-50% tokens.
    """
    crop = entities["crops"][0] if entities["crops"] else None
    disease = entities["diseases"][0] if entities["diseases"] else None
    location = entities["locations"][0] if entities["locations"] else None

    if intent == "disease_query" and crop:
        return f"For {crop}: identify '{disease or 'possible diseases'}', symptoms, treatment (2 sentences). JSON not needed."

    if intent == "crop_advisory" and location:
        return f"Top 3 crops for {location} region, current season. Brief, 2-3 lines each."

    if intent == "pest_query" and crop:
        return f"Common pests of {crop}: name, damage, organic+chemical control. Max 3 pests, concise."

    if intent == "irrigation_query" and crop:
        return f"{crop} irrigation: frequency, amount, best method. 3 sentences max."

    if intent == "fertilizer_query" and crop:
        return f"{crop} fertilizer schedule: NPK ratio, organic options, timing. Concise."

    if intent == "greeting":
        return "Respond with a brief friendly greeting as an agricultural AI assistant."

    # Default — pass through with minimal wrapper
    return f"Answer concisely (2-4 sentences): {user_text}"


# ═══════════════════════════════════════════════════════════════════════════════
# Location-Based Crop Advisor
# ═══════════════════════════════════════════════════════════════════════════════

# Region → season → recommended crops (pre-built, 0 tokens to Gemini)
REGIONAL_CROP_DATA = {
    "karnataka": {
        "kharif": ["Rice (Paddy)", "Ragi", "Maize", "Cotton", "Groundnut", "Soybean"],
        "rabi": ["Wheat", "Chickpea", "Jowar", "Sunflower", "Safflower"],
        "summer": ["Watermelon", "Muskmelon", "Cucumber", "Vegetables"],
        "perennial": ["Coconut", "Arecanut", "Coffee", "Mango", "Banana"],
    },
    "maharashtra": {
        "kharif": ["Rice", "Soybean", "Cotton", "Sugarcane", "Groundnut"],
        "rabi": ["Wheat", "Chickpea", "Jowar", "Onion", "Safflower"],
        "summer": ["Watermelon", "Vegetables", "Groundnut"],
        "perennial": ["Mango", "Grape", "Pomegranate", "Orange"],
    },
    "punjab": {
        "kharif": ["Rice", "Maize", "Cotton", "Sugarcane", "Bajra"],
        "rabi": ["Wheat", "Mustard", "Chickpea", "Barley", "Potato"],
        "summer": ["Moong", "Vegetables", "Fodder crops"],
        "perennial": ["Citrus", "Guava", "Kinnu"],
    },
    "tamil_nadu": {
        "kharif": ["Rice", "Cotton", "Groundnut", "Sugarcane", "Millets"],
        "rabi": ["Rice (Samba)", "Pulses", "Sesame", "Sunflower"],
        "summer": ["Watermelon", "Vegetables", "Pulses"],
        "perennial": ["Coconut", "Banana", "Mango", "Tea", "Coffee"],
    },
    "uttar_pradesh": {
        "kharif": ["Rice", "Sugarcane", "Maize", "Bajra", "Soybean"],
        "rabi": ["Wheat", "Potato", "Mustard", "Chickpea", "Pea"],
        "summer": ["Moong", "Vegetables", "Watermelon"],
        "perennial": ["Mango", "Guava", "Litchi"],
    },
    "default": {
        "kharif": ["Rice", "Maize", "Cotton", "Groundnut", "Soybean"],
        "rabi": ["Wheat", "Chickpea", "Mustard", "Potato", "Onion"],
        "summer": ["Watermelon", "Cucumber", "Vegetables", "Moong"],
        "perennial": ["Mango", "Banana", "Coconut", "Guava"],
    },
}


def get_season_from_month(month: int) -> str:
    """Determine Indian agricultural season from month number."""
    if month in (6, 7, 8, 9, 10):
        return "kharif"
    elif month in (11, 12, 1, 2):
        return "rabi"
    else:
        return "summer"


def get_regional_crops(state: str, season: str) -> List[str]:
    """Get recommended crops for a region and season."""
    state_key = state.lower().replace(" ", "_")
    region_data = REGIONAL_CROP_DATA.get(state_key, REGIONAL_CROP_DATA["default"])
    return region_data.get(season, region_data.get("kharif", []))
