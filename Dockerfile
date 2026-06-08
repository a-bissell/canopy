FROM node:22-slim AS frontend-build
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml README.md ./
RUN pip install --no-cache-dir .

COPY canopy/ canopy/
COPY --from=frontend-build /build/dist frontend/dist/

RUN mkdir -p data/packages data/certs

EXPOSE 8080 17883

CMD ["python", "-m", "canopy"]
