import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.websocket_manager import manager
from app.api.v1.chat import synthesize_voice_elevenlabs

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def trigger_morning_briefing():
    logger.info("Executing Morning Briefing...")
    try:
        from sqlmodel import Session, select
        from app.core.database import engine
        from app.models.user import User
        from app.services.agent_orchestrator import agent_graph
        from langchain_core.messages import HumanMessage
        
        with Session(engine) as db:
            users = db.exec(select(User).where(User.is_active == True)).all()
            for user in users:
                inputs = {
                    "messages": [HumanMessage(content="Generate my Morning Briefing. Include today's calendar events, recent news, and pending reminders.")],
                    "task_type": "tool_task",
                    "user_id": user.id,
                    "error_count": 0,
                    "tool_call_depth": 0
                }
                final_state = await agent_graph.ainvoke(inputs)
                briefing_text = final_state["messages"][-1].content
                
                # Voice Synthesis for Morning Briefing
                voice_url = await synthesize_voice_elevenlabs(briefing_text)
                
                # Push via WebSockets if connected
                payload = {
                    "type": "proactive_alert",
                    "title": "Morning Briefing",
                    "message": briefing_text,
                    "voice_url": voice_url
                }
                await manager.broadcast_to_user(user.id, payload)
    except Exception as e:
        logger.error(f"Morning Briefing failed: {e}")

async def check_reminders():
    # Poll for due reminders and push alerts
    try:
        from sqlmodel import Session, select
        from app.core.database import engine
        from app.models.reminder import Reminder
        from datetime import datetime, timezone
        
        with Session(engine) as db:
            now = datetime.now(timezone.utc)
            due_reminders = db.exec(
                select(Reminder)
                .where(Reminder.is_delivered == False, Reminder.scheduled_at <= now)
            ).all()
            
            for reminder in due_reminders:
                payload = {
                    "type": "proactive_alert",
                    "title": "Reminder Triggered",
                    "message": reminder.message
                }
                await manager.broadcast_to_user(reminder.user_id, payload)
                
                # Also send OS Desktop Notification
                try:
                    from plyer import notification
                    notification.notify(
                        title="JARVIS Reminder",
                        message=reminder.message,
                        app_name="JARVIS",
                        timeout=10
                    )
                except Exception as e:
                    logger.error(f"Failed to send OS notification for reminder: {e}")

                reminder.is_delivered = True
                db.add(reminder)
            if due_reminders:
                db.commit()
    except Exception as e:
        logger.error(f"Error checking reminders: {e}")

def start_scheduler():
    # 8 AM daily briefing
    scheduler.add_job(trigger_morning_briefing, 'cron', hour=8, minute=0)
    # Check reminders every 30 seconds
    scheduler.add_job(check_reminders, 'interval', seconds=30)
    scheduler.start()
    logger.info("APScheduler started successfully.")
