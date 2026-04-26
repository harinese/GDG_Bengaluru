"""
voice_processor.py — Voice-to-Text for AgriLens
═════════════════════════════════════════════════
Handles audio file uploads and converts speech to text.

Primary:   Google Web Speech API via SpeechRecognition library (free)
Fallback:  Returns error with suggestion to use browser's Web Speech API

Supported formats: WAV, WEBM, OGG, MP3, FLAC
"""

import io
import os
import logging
import tempfile
from typing import Optional, Tuple

log = logging.getLogger("agrilens.voice")

# ── Try loading speech recognition ────────────────────────────────────────────
_sr = None
_AudioSegment = None

try:
    import speech_recognition as sr
    _sr = sr
    log.info("SpeechRecognition loaded")
except ImportError:
    log.warning("SpeechRecognition not installed")

try:
    from pydub import AudioSegment
    _AudioSegment = AudioSegment
    log.info("pydub loaded")
except ImportError:
    log.warning("pydub not installed — audio conversion unavailable")


# ═══════════════════════════════════════════════════════════════════════════════
# Audio Conversion
# ═══════════════════════════════════════════════════════════════════════════════

def _convert_to_wav(audio_bytes: bytes, source_format: str) -> bytes:
    """Convert any audio format to WAV for speech recognition."""
    if _AudioSegment is None:
        raise RuntimeError("pydub not available for audio conversion")

    fmt_map = {
        "audio/webm": "webm",
        "audio/ogg": "ogg",
        "audio/mp3": "mp3",
        "audio/mpeg": "mp3",
        "audio/flac": "flac",
        "audio/wav": "wav",
        "audio/x-wav": "wav",
    }

    fmt = fmt_map.get(source_format, source_format.split("/")[-1])

    if fmt == "wav":
        return audio_bytes

    try:
        audio = _AudioSegment.from_file(io.BytesIO(audio_bytes), format=fmt)
        # Convert to mono 16kHz WAV (optimal for speech recognition)
        audio = audio.set_channels(1).set_frame_rate(16000)
        wav_buffer = io.BytesIO()
        audio.export(wav_buffer, format="wav")
        return wav_buffer.getvalue()
    except Exception as e:
        log.error("Audio conversion failed: %s", e)
        raise RuntimeError(f"Failed to convert {fmt} to WAV: {e}")


# ═══════════════════════════════════════════════════════════════════════════════
# Speech-to-Text
# ═══════════════════════════════════════════════════════════════════════════════

def transcribe_audio(
    audio_bytes: bytes,
    mime_type: str = "audio/wav",
    language: str = "en-IN",
) -> Tuple[str, float]:
    """
    Transcribe audio bytes to text.

    Args:
        audio_bytes: Raw audio file bytes
        mime_type: MIME type of the audio
        language: BCP-47 language code (en-IN, hi-IN, kn-IN)

    Returns:
        Tuple of (transcribed_text, confidence_score)
    """
    if _sr is None:
        raise RuntimeError("SpeechRecognition library not installed")

    # Convert to WAV if needed
    if mime_type not in ("audio/wav", "audio/x-wav"):
        audio_bytes = _convert_to_wav(audio_bytes, mime_type)

    recognizer = _sr.Recognizer()
    recognizer.energy_threshold = 300
    recognizer.dynamic_energy_threshold = True

    # Write to temp file for SpeechRecognition
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        with _sr.AudioFile(tmp_path) as source:
            audio_data = recognizer.record(source)

        # Try Google Web Speech API (free, no key needed)
        try:
            text = recognizer.recognize_google(
                audio_data,
                language=language,
                show_all=False,
            )
            log.info("Transcribed (%s): '%s'", language, text[:100])
            return text, 0.9  # Google doesn't return confidence by default
        except _sr.UnknownValueError:
            log.warning("Speech not recognized")
            return "", 0.0
        except _sr.RequestError as e:
            log.error("Google Speech API error: %s", e)
            raise RuntimeError(f"Speech API error: {e}")

    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


# ═══════════════════════════════════════════════════════════════════════════════
# Language Detection (simple heuristic for Indic scripts)
# ═══════════════════════════════════════════════════════════════════════════════

def detect_language_code(text: str) -> str:
    """
    Detect language from text to route speech recognition.
    Returns BCP-47 language code.
    """
    # Check for Devanagari (Hindi)
    if any('\u0900' <= c <= '\u097F' for c in text):
        return "hi-IN"

    # Check for Kannada
    if any('\u0C80' <= c <= '\u0CFF' for c in text):
        return "kn-IN"

    # Check for Telugu
    if any('\u0C00' <= c <= '\u0C7F' for c in text):
        return "te-IN"

    # Check for Tamil
    if any('\u0B80' <= c <= '\u0BFF' for c in text):
        return "ta-IN"

    return "en-IN"


# Language code mapping for frontend
SUPPORTED_LANGUAGES = {
    "en": "en-IN",
    "hi": "hi-IN",
    "kn": "kn-IN",
    "te": "te-IN",
    "ta": "ta-IN",
}
