# AeroEdge-X Production AI Backend Dockerfile
# Optimized for Hugging Face Spaces (Free Tier 16GB RAM) & Cloud Docker
FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PORT=7860 \
    HOME=/home/user

# Install system dependencies for OpenCV and PyMuPDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set up user for Hugging Face Spaces (UID 1000)
RUN useradd -m -u 1000 user
WORKDIR /home/user/app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source and grant ownership
COPY --chown=user:user . .

# Ensure writable runtime directories exist with write permissions
RUN mkdir -p uploads reports logs database data/chroma && \
    chown -R user:user /home/user/app

USER user

EXPOSE 7860

# Run with Gunicorn WSGI server on port 7860
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "1", "--threads", "4", "--timeout", "120", "app:create_app()"]
