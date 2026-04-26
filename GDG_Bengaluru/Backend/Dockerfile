FROM python:3.10-slim

# Install system dependencies (ffmpeg is often required for audio processing via pydub)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (for better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model (used by NLP processor)
RUN python -m spacy download en_core_web_sm || true

# Copy all the rest of the backend files
COPY . .

EXPOSE 8000

# Start Uvicorn when the container launches
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
