import os
import uuid
import logging
from typing import List, Dict, Any, Optional
from playwright.async_api import async_playwright
from app.core.config import settings

logger = logging.getLogger(__name__)

class BrowserService:
    def __init__(self):
        self.headless = settings.PLAYWRIGHT_HEADLESS
        self.timeout = settings.PLAYWRIGHT_TIMEOUT
        self.screenshot_dir = os.path.join(settings.WORKSPACE_DIR, "static", "screenshots")
        os.makedirs(self.screenshot_dir, exist_ok=True)

    async def browse_url(
        self, 
        url: str, 
        actions: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Launches Playwright dynamically, navigates to target URL, 
        executes list of interactive steps (clicks, inputs), captures 
        text content, and returns details.
        """
        logger.info(f"Launching Playwright to browse URL: {url}")
        
        async with async_playwright() as p:
            # Launch chromium instance
            browser = await p.chromium.launch(headless=self.headless)
            context = await browser.new_context(
                viewport={"width": 1280, "height": 800},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            
            try:
                # Go to page
                await page.goto(url, timeout=self.timeout, wait_until="networkidle")
                
                # Execute any custom sequential steps
                action_results = []
                if actions:
                    for action in actions:
                        act_type = action.get("type")
                        selector = action.get("selector")
                        value = action.get("value")
                        
                        logger.info(f"Executing browser action: {act_type} on {selector}")
                        
                        if act_type == "click" and selector:
                            await page.click(selector, timeout=5000)
                            action_results.append(f"Clicked {selector}")
                        elif act_type == "fill" and selector and value:
                            await page.fill(selector, value, timeout=5000)
                            action_results.append(f"Filled {selector} with '{value}'")
                        elif act_type == "wait" and value:
                            # Wait for specified ms
                            await page.wait_for_timeout(int(value))
                            action_results.append(f"Waited {value}ms")
                
                # Extract page details
                title = await page.title()
                html = await page.content()
                
                # Extract visible text content
                text_content = await page.evaluate("() => document.body.innerText")
                
                # Capture visual screenshot
                screenshot_filename = f"screenshot_{uuid.uuid4()}.png"
                screenshot_path = os.path.join(self.screenshot_dir, screenshot_filename)
                await page.screenshot(path=screenshot_path)
                logger.info(f"Screenshot captured and saved to {screenshot_path}")

                return {
                    "status": "success",
                    "url": page.url,
                    "title": title,
                    "text": text_content,
                    "screenshot_path": screenshot_path,
                    "actions_log": action_results
                }
            except Exception as e:
                logger.error(f"Browser automation failed: {e}")
                return {
                    "status": "error",
                    "message": str(e)
                }
            finally:
                await context.close()
                await browser.close()

# Global Browser Service Instance
browser_service = BrowserService()
