import os
from celery import Celery
from app.core.config import settings

# Determine Redis URL (defaulting to localhost if not specified)
redis_url = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "jarvis_worker",
    broker=redis_url,
    backend=redis_url,
    include=["app.api.v1.agents", "app.services.memory_agent"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)
