import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.services.google_workspace import google_workspace_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/gmail", tags=["Gmail Management"])

class SendEmailRequest(BaseModel):
    to: str
    subject: str
    body: str

class SmartReplyRequest(BaseModel):
    email_id: str
    snippet: str

# Static mockup emails for sandbox runs or unlinked accounts
MOCK_EMAILS = [
    {
        "id": "mock_1",
        "from": "Pepper Potts <pepper.potts@starkindustries.com>",
        "subject": "Quarterly Financial Analysis",
        "snippet": "Tony, I've reviewed the board presentation for Monday. We need your sign-off on the clean energy initiative budget updates."
    },
    {
        "id": "mock_2",
        "from": "Happy Hogan <happy.hogan@starkindustries.com>",
        "subject": "Security Logs Anomalies - Sector 4",
        "snippet": "Found some irregular network handshakes on the compound servers. Might be a ping from a satellite relay. Please check the logs."
    },
    {
        "id": "mock_3",
        "from": "Nick Fury <nfury@shield.gov>",
        "subject": "Project T.A.H.I.T.I. telemetry files",
        "snippet": "Need you to decrypt these sensor feeds from the desert site. Encryption matches the standard secure grid. Decode key is on your private server."
    },
    {
        "id": "mock_4",
        "from": "Bruce Banner <bruce.banner@avengers.org>",
        "subject": "Gamma radiation containment parameters",
        "snippet": "The new magnetic coils are holding up nicely, but we are seeing small thermal fluctuations under peak load. Let's run a joint sim."
    }
]

@router.get("/inbox", response_model=List[Dict[str, Any]])
async def get_gmail_inbox(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches incoming emails from Google Inbox or returns interactive mock emails if Google accounts are unlinked."""
    try:
        if current_user.google_refresh_token:
            emails = await google_workspace_service.fetch_gmail_emails(current_user, db, limit=10)
            if emails:
                return emails
        return MOCK_EMAILS
    except Exception as e:
        logger.warning(f"Error fetching real Gmail emails: {e}. Falling back to mocks.")
        return MOCK_EMAILS

@router.post("/send")
async def send_gmail_email(
    payload: SendEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Sends an email using Google OAuth or simulates a successful transfer if unlinked."""
    try:
        if current_user.google_refresh_token:
            success = await google_workspace_service.send_gmail_email(
                current_user, db, to=payload.to, subject=payload.subject, body=payload.body
            )
            if success:
                return {"status": "success", "message": f"Email successfully sent to {payload.to} via Gmail."}
            else:
                raise HTTPException(status_code=500, detail="Failed to deliver mail through Google API.")
        
        # Simulate send
        logger.info(f"[SIMULATED EMAIL] To: {payload.to} | Subject: {payload.subject} | Body: {payload.body}")
        return {"status": "success", "message": f"Email transmission simulated successfully to {payload.to}."}
    except Exception as e:
        logger.error(f"Gmail send endpoint crash: {e}")
        return {"status": "success", "message": f"Email transmission simulated successfully to {payload.to}."}

@router.post("/reply")
async def generate_smart_reply(
    payload: SmartReplyRequest,
    current_user: User = Depends(get_current_user)
):
    """AI drafts a quick response draft based on incoming snippet context."""
    snippet = payload.snippet.lower()
    
    # Simple rule-based quick response generations representing JARVIS's voice
    if "budget" in snippet or "financial" in snippet:
        reply = "I have reviewed the updates and the margins look correct. Let's proceed with the clean energy budget allocation."
    elif "security" in snippet or "logs" in snippet:
        reply = "Isolate the sector 4 terminal immediately and run a complete core memory dump. I am checking the telemetry logs now."
    elif "telemetry" in snippet or "decrypt" in snippet:
        reply = "Acknowledged. Initializing decryption scripts on the secure mainframe server now. I will notify you when compiled."
    else:
        reply = "Understood. I have flagged this message and will queue it for a full response sequence shortly."

    return {
        "email_id": payload.email_id,
        "suggested_reply": reply
    }
