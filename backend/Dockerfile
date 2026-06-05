# --- BUILD AND RUNTIME STAGE ---
FROM python:3.11-slim AS runner

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Install Playwright browser binaries and system dependencies
# Installs chromium browser only to save space, along with its operating system dependencies
RUN playwright install chromium \
    && playwright install-deps chromium \
    && rm -rf /var/lib/apt/lists/*

# Copy backend application source code
COPY . .

# Expose backend port
EXPOSE 8000

# Start server using Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
