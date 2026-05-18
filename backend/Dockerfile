# Use python slim matching the venv's Python 3.14 version
FROM python:3.14-slim

# Set working directory inside the container
WORKDIR /app

# Install system dependencies if required for pip builds
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend dependencies definition
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY . .

# Expose backend port
EXPOSE 8000

# Start Uvicorn ASGI server
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
