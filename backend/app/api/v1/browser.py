import os
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
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
        # Schedule browser automation as a background task
        import uuid
        import asyncio
        task_id = str(uuid.uuid4())
        
        # Store task status in memory for this prototype
        # In production this would be in Redis or DB
        if not hasattr(router, "tasks"):
            router.tasks = {}
            
        router.tasks[task_id] = {"status": "processing"}
        
        async def background_browse():
            try:
                res = await browser_service.browse_url(payload.url, actions=actions_list)
                if res.get("status") == "success":
                    raw_path = res.get("screenshot_path")
                    screenshot_url = None
                    if raw_path:
                        filename = os.path.basename(raw_path)
                        screenshot_url = f"/static/screenshots/{filename}"
                        
                    router.tasks[task_id] = {
                        "status": "success",
                        "url": res.get("url"),
                        "title": res.get("title"),
                        "screenshot_url": screenshot_url,
                        "actions_log": res.get("actions_log", []),
                        "extracted_text": res.get("text")[:2000]
                    }
                else:
                    router.tasks[task_id] = {"status": "failed", "error": res.get("message")}
            except Exception as e:
                router.tasks[task_id] = {"status": "failed", "error": str(e)}

        asyncio.create_task(background_browse())
        
        return {
            "status": "processing",
            "task_id": task_id,
            "message": "Browser automation offloaded to background task."
        }
            
    except Exception as e:
        logger.error(f"Browser automation endpoint crash: {e}")
        raise HTTPException(status_code=500, detail=f"Automation error: {str(e)}")

@router.get("/task/{task_id}")
async def get_browser_task_status(task_id: str):
    """Poll endpoint to check background browser automation status."""
    if not hasattr(router, "tasks") or task_id not in router.tasks:
        raise HTTPException(status_code=404, detail="Task not found")
        
    return router.tasks[task_id]
