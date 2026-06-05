from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from app.core.database import engine
from app.api.v1 import router as api_v1_router
# Import all models to ensure SQLModel knows about them on create_all
import app.models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables if they do not exist
    SQLModel.metadata.create_all(engine)
    yield

app = FastAPI(
    title="JARVIS - AI Operating System",
    description="Backend API gateway for JARVIS AI Operating System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(api_v1_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "JARVIS API Gateway",
        "version": "1.0.0"
    }
