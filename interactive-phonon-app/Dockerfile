# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app

# Copy package files and install deps
COPY package.json package-lock.json ./
RUN npm ci

# Copy all frontend source
COPY . .

# Build React app (Vite output goes to dist/)
RUN npm run build

# Stage 2: Build FastAPI backend
FROM python:3.12-slim
WORKDIR /app

# Install Python deps
COPY api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy FastAPI backend
COPY api/ ./

# Copy frontend build from previous stage
COPY --from=frontend-build /app/dist ./frontend/dist

# Expose port
EXPOSE 8000

# Run FastAPI
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]