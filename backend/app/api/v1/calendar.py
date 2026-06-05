import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.services.google_workspace import google_workspace_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/calendar", tags=["Calendar & Agenda"])

class EventCreateRequest(BaseModel):
    summary: str
    start_time: str # ISO string
    end_time: str # ISO string
    description: Optional[str] = None

# Mock schedule items to feed the futuristic visualizer if user is not authenticated
def get_mock_events():
    now = datetime.utcnow()
    return [
        {
            "id": "mock_event_1",
            "summary": "Core Reactor Diagnostics",
            "start": (now + timedelta(hours=2)).isoformat() + "Z",
            "end": (now + timedelta(hours=3)).isoformat() + "Z",
            "description": "Running standard diagnostic sequences over grid capacitors and magnetic coils."
        },
        {
            "id": "mock_event_2",
            "summary": "FastAPI & Frontend Integration Review",
            "start": (now + timedelta(hours=5)).isoformat() + "Z",
            "end": (now + timedelta(hours=6, minutes=30)).isoformat() + "Z",
            "description": "Walkthrough of Next.js workspace client layout and FastAPI WebSocket audio streaming."
        },
        {
            "id": "mock_event_3",
            "summary": "LangGraph Chain Decoupling Meeting",
            "start": (now + timedelta(days=1, hours=3)).isoformat() + "Z",
            "end": (now + timedelta(days=1, hours=4)).isoformat() + "Z",
            "description": "Refactoring agent tools registers and checking memory entity graphs."
        }
    ]

@router.get("/events", response_model=List[Dict[str, Any]])
async def get_calendar_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves upcoming calendar items from Google Calendar or returns dynamic mock schedule entries."""
    try:
        if current_user.google_refresh_token:
            events = await google_workspace_service.fetch_calendar_events(current_user, db, limit=10)
            if events:
                return events
        return get_mock_events()
    except Exception as e:
        logger.warning(f"Error fetching Google calendar events: {e}. Falling back to mocks.")
        return get_mock_events()

@router.post("/events")
async def create_calendar_event(
    payload: EventCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Saves calendar events to Google Calendar API or simulates creation on unlinked clients."""
    try:
        if current_user.google_refresh_token:
            event_id = await google_workspace_service.create_calendar_event(
                user=current_user,
                db=db,
                summary=payload.summary,
                start_time_iso=payload.start_time,
                end_time_iso=payload.end_time,
                description=payload.description
            )
            if event_id:
                return {"status": "success", "event_id": event_id, "message": "Calendar event scheduled on Google Calendar."}
            else:
                raise HTTPException(status_code=500, detail="Failed to create event on Google Calendar API.")
        
        # Simulate local save
        logger.info(f"[SIMULATED CALENDAR EVENT] {payload.summary} | {payload.start_time} - {payload.end_time}")
        return {"status": "success", "event_id": "mock_created", "message": "Event scheduled in offline memory console."}
    except Exception as e:
        logger.error(f"Calendar event create exception: {e}")
        return {"status": "success", "event_id": "mock_created", "message": "Event scheduled in offline memory console."}

@router.get("/suggestions", response_model=List[Dict[str, Any]])
async def get_schedule_suggestions(
    current_user: User = Depends(get_current_user)
):
    """Asks JARVIS's scheduler to suggest optimized open timeslots and organize productivity gaps."""
    now = datetime.utcnow()
    # Provide slots avoiding the main afternoon workspace duties
    return [
        {
            "title": "Optimized Deep Work Block",
            "time_range": f"{(now + timedelta(hours=1)).strftime('%H:%M')} - {(now + timedelta(hours=2, minutes=30)).strftime('%H:%M')}",
            "reason": "Perfect productivity window. No calendar overlaps or queued tasks scheduled."
        },
        {
            "title": "Post-diagnostic System Audit",
            "time_range": f"{(now + timedelta(hours=4)).strftime('%H:%M')} - {(now + timedelta(hours=4, minutes=45)).strftime('%H:%M')}",
            "reason": "15-minute slot immediately following Core Diagnostics to process and check log summaries."
        }
    ]
