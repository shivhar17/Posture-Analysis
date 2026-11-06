FROM python:3.11-slim

# Install system dependencies needed by OpenCV and MediaPipe
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Download pose model and generate models if not bundled
RUN python generate_dataset.py && python train_model.py

EXPOSE 5000

ENV PORT=5000
CMD ["sh", "-c", "gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 120"]
