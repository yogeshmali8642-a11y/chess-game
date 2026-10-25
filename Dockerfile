FROM python:3.11-slim

WORKDIR /app

# Install optional system Stockfish engine for grandmaster play
RUN apt-get update && apt-get install -y --no-install-recommends \
    stockfish \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8000
ENV HOST=0.0.0.0

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
