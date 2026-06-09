import os
import uuid
import logging
import asyncio
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from app.core.database import get_db, engine
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.task import BrowserTask
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
    db: Session = Depends(get_db),
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
        task_id = str(uuid.uuid4())
        
        # Save task to database
        db_task = BrowserTask(
            id=task_id,
            user_id=current_user.id,
            status="processing",
            url=payload.url
        )
        db.add(db_task)
        db.commit()
        
        async def background_browse():
            try:
                res = await browser_service.browse_url(payload.url, actions=actions_list)
                with Session(engine) as session:
                    task = session.get(BrowserTask, task_id)
                    if task:
                        if res.get("status") == "success":
                            raw_path = res.get("screenshot_path")
                            screenshot_url = None
                            if raw_path:
                                filename = os.path.basename(raw_path)
                                screenshot_url = f"/static/screenshots/{filename}"
                                
                            task.status = "success"
                            task.title = res.get("title")
                            task.screenshot_url = screenshot_url
                            task.actions_log = json.dumps(res.get("actions_log", []))
                            task.extracted_text = res.get("text")[:2000]
                        else:
                            task.status = "failed"
                            task.error = res.get("message")
                        session.add(task)
                        session.commit()
            except Exception as e:
                logger.error(f"Background browse task failed: {e}")
                with Session(engine) as session:
                    task = session.get(BrowserTask, task_id)
                    if task:
                        task.status = "failed"
                        task.error = str(e)
                        session.add(task)
                        session.commit()

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
async def get_browser_task_status(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Poll endpoint to check background browser automation status."""
    task = db.get(BrowserTask, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    actions_log = []
    if task.actions_log:
        try:
            actions_log = json.loads(task.actions_log)
        except Exception:
            actions_log = []
            
    return {
        "status": task.status,
        "url": task.url,
        "title": task.title,
        "screenshot_url": task.screenshot_url,
        "actions_log": actions_log,
        "extracted_text": task.extracted_text,
        "error": task.error
    }
