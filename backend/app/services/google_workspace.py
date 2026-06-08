import logging
import httpx
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)

class GoogleWorkspaceService:
    def __init__(self):
        self.token_url = "https://oauth2.googleapis.com/token"
        self.gmail_base_url = "https://gmail.googleapis.com/gmail/v1/users/me"
        self.calendar_base_url = "https://www.googleapis.com/calendar/v3"

    async def get_valid_access_token(self, user: User, db: Session) -> Optional[str]:
        """
        Retrieves the user's active Google OAuth access token.
        If it has expired, uses the refresh token to get a new one and updates the database.
        """
        if not user.google_refresh_token:
            logger.warning(f"No Google refresh token found for User ID {user.id}")
            return None

        # If we had token expiry tracking, we would compare times, 
        # but to guarantee reliability, we can perform a refresh or try to use the current one.
        # Here we perform an immediate token refresh if credentials exist.
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.token_url,
                    data={
                        "client_id": settings.GOOGLE_CLIENT_ID,
                        "client_secret": settings.GOOGLE_CLIENT_SECRET,
                        "refresh_token": user.google_refresh_token,
                        "grant_type": "refresh_token",
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    new_access_token = data.get("access_token")
                    
                    # Update database user details
                    user.google_oauth_token = new_access_token
                    db.commit()
                    db.refresh(user)
                    
                    return new_access_token
                else:
                    logger.error(f"Failed to refresh Google token: {response.text}")
                    # If refresh fails, fall back to current active token
                    return user.google_oauth_token
        except Exception as e:
            logger.error(f"Token refresh request exception: {e}")
            return user.google_oauth_token

    async def fetch_gmail_emails(self, user: User, db: Session, limit: int = 5) -> List[Dict[str, Any]]:
        """List incoming emails from the user's Gmail inbox."""
        token = await self.get_valid_access_token(user, db)
        if not token:
            raise PermissionError("User is not authenticated with Google OAuth")

        headers = {"Authorization": f"Bearer {token}"}
        async with httpx.AsyncClient() as client:
            # Step 1: List message IDs
            list_url = f"{self.gmail_base_url}/messages?maxResults={limit}&q=label:INBOX"
            res = await client.get(list_url, headers=headers)
            
            if res.status_code != 200:
                logger.error(f"Gmail listing failed: {res.text}")
                return []
                
            messages_summary = res.json().get("messages", [])
            parsed_emails = []
            
            # Step 2: Fetch details for each message ID
            for msg in messages_summary:
                msg_id = msg["id"]
                detail_url = f"{self.gmail_base_url}/messages/{msg_id}"
                detail_res = await client.get(detail_url, headers=headers)
                
                if detail_res.status_code == 200:
                    data = detail_res.json()
                    headers_list = data.get("payload", {}).get("headers", [])
                    
                    subject = next((h["value"] for h in headers_list if h["name"].lower() == "subject"), "No Subject")
                    sender = next((h["value"] for h in headers_list if h["name"].lower() == "from"), "Unknown")
                    snippet = data.get("snippet", "")
                    
                    parsed_emails.append({
                        "id": msg_id,
                        "from": sender,
                        "subject": subject,
                        "snippet": snippet
                    })
            
            return parsed_emails

    async def send_gmail_email(self, user: User, db: Session, to: str, subject: str, body: str) -> bool:
        """Sends an email message via Gmail API."""
        token = await self.get_valid_access_token(user, db)
        if not token:
            raise PermissionError("User is not authenticated with Google OAuth")

        # Construct raw MIME message base64url encoded
        import base64
        from email.mime.text import MIMEText
        
        message = MIMEText(body)
        message['to'] = to
        message['subject'] = subject
        
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            send_url = f"{self.gmail_base_url}/messages/send"
            res = await client.post(send_url, json={"raw": raw_message}, headers=headers)
            
            if res.status_code == 200:
                logger.info(f"Email sent successfully to {to}")
                return True
            else:
                logger.error(f"Failed to send email: {res.text}")
                return False

    async def fetch_calendar_events(self, user: User, db: Session, limit: int = 10) -> List[Dict[str, Any]]:
        """List upcoming Google Calendar events."""
        token = await self.get_valid_access_token(user, db)
        if not token:
            raise PermissionError("User is not authenticated with Google OAuth")

        headers = {"Authorization": f"Bearer {token}"}
        time_min = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        
        async with httpx.AsyncClient() as client:
            url = f"{self.calendar_base_url}/calendars/primary/events?maxResults={limit}&timeMin={time_min}&singleEvents=true&orderBy=startTime"
            res = await client.get(url, headers=headers)
            
            if res.status_code != 200:
                logger.error(f"Calendar fetching failed: {res.text}")
                return []
                
            items = res.json().get("items", [])
            events = []
            for item in items:
                events.append({
                    "id": item.get("id"),
                    "summary": item.get("summary", "No Title"),
                    "start": item.get("start", {}).get("dateTime") or item.get("start", {}).get("date"),
                    "end": item.get("end", {}).get("dateTime") or item.get("end", {}).get("date"),
                    "description": item.get("description", "")
                })
            return events

    async def create_calendar_event(
        self, 
        user: User, 
        db: Session, 
        summary: str, 
        start_time_iso: str, 
        end_time_iso: str, 
        description: Optional[str] = None
    ) -> Optional[str]:
        """Creates a calendar event on Google Calendar."""
        token = await self.get_valid_access_token(user, db)
        if not token:
            raise PermissionError("User is not authenticated with Google OAuth")

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        event_payload = {
            "summary": summary,
            "description": description,
            "start": {"dateTime": start_time_iso, "timeZone": "UTC"},
            "end": {"dateTime": end_time_iso, "timeZone": "UTC"}
        }

        async with httpx.AsyncClient() as client:
            url = f"{self.calendar_base_url}/calendars/primary/events"
            res = await client.post(url, json=event_payload, headers=headers)
            
            if res.status_code == 200:
                event_id = res.json().get("id")
                logger.info(f"Calendar event '{summary}' created successfully: ID {event_id}")
                return event_id
            else:
                logger.error(f"Failed to create calendar event: {res.text}")
                return None

# Global Workspace Instance
google_workspace_service = GoogleWorkspaceService()
