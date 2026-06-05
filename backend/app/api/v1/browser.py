import os
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.v1.auth import get_current_user
from app.models.user import User
from app.services.browser import browser_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/browser", tags=["Browser Automation"])

class BrowserAction(BaseModel):
    type: str # "click", "fill", "wait"
    selector: Optional[str] = None
    value: Optional[str] = None

class BrowseRequest(BaseModel):
    url: str
    actions: Optional[List[BrowserAction]] = None

@router.post("/browse")
async def execute_browse(
    payload: BrowseRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Triggers Playwright to load a webpage, execute optional UI actions 
    (clicks, inputs, waits), captures a screenshot, and returns the visual assets.
    """
    # Verify prefix and parse request actions
    actions_list = []
    if payload.actions:
        for act in payload.actions:
            actions_list.append({
                "type": act.type,
                "selector": act.selector,
                "value": act.value
            })
            
    try:
        logger.info(f"Executing automate browse request for user {current_user.id} to URL: {payload.url}")
        
        # Call the Playwright browser service
        res = await browser_service.browse_url(payload.url, actions=actions_list)
        
        if res.get("status") == "success":
            # Map absolute screenshot path to static URL path for frontend rendering
            raw_path = res.get("screenshot_path")
            screenshot_url = None
            if raw_path:
                filename = os.path.basename(raw_path)
                screenshot_url = f"/static/screenshots/{filename}"
                
            return {
                "status": "success",
                "url": res.get("url"),
                "title": res.get("title"),
                "screenshot_url": screenshot_url,
                "actions_log": res.get("actions_log", []),
                "extracted_text": res.get("text")[:2000] # Truncate to save bandwidth
            }
        else:
            raise HTTPException(
                status_code=500, 
                detail=f"Browser automation failed: {res.get('message', 'Unknown Playwright error.')}"
            )
            
    except Exception as e:
        logger.error(f"Browser automation endpoint crash: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Automation error: {str(e)}"
        )
