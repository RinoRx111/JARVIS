import logging
from typing import Optional
from langchain_core.tools import tool
from sqlmodel import Session
from app.models.user import User
from app.models.reminder import Reminder

logger = logging.getLogger(__name__)

async def invoke_create_reminder(user: User, db: Session, message: str, scheduled_at_iso: str) -> str:
    """Creates a reminder in the database."""
    try:
        from dateutil import parser
        from datetime import timezone
        dt = parser.parse(scheduled_at_iso)
        if not dt.tzinfo:
            dt = dt.replace(tzinfo=timezone.utc)
            
        new_reminder = Reminder(user_id=user.id, message=message, scheduled_at=dt)
        db.add(new_reminder)
        db.commit()
        db.refresh(new_reminder)
        return f"Reminder set successfully for {dt.strftime('%Y-%m-%d %H:%M:%S %Z')}: '{message}'"
    except Exception as e:
        logger.error(f"Failed to create reminder: {e}")
        return f"Error creating reminder: {e}"

async def invoke_list_reminders(user: User, db: Session) -> str:
    """Lists pending reminders from the database."""
    from sqlmodel import select
    try:
        reminders = db.exec(
            select(Reminder)
            .where(Reminder.user_id == user.id, Reminder.is_delivered == False)
            .order_by(Reminder.scheduled_at)
        ).all()
        
        if not reminders:
            return "No pending reminders."
            
        out = []
        for r in reminders:
            out.append(f"ID: {r.id} | Time: {r.scheduled_at} | Message: {r.message}")
        return "\n".join(out)
    except Exception as e:
        logger.error(f"Failed to list reminders: {e}")
        return f"Error listing reminders: {e}"

@tool
def create_reminder_tool(message: str, scheduled_at_iso: str) -> str:
    """
    Schedules a new reminder for the user.
    `message` is the text of the reminder.
    `scheduled_at_iso` MUST be a valid ISO-8601 formatted datetime string (e.g., '2026-06-08T15:00:00Z').
    """
    pass

@tool
def list_reminders_tool() -> str:
    """Lists all currently pending scheduled reminders."""
    pass
