import os
import uuid
import logging
from langchain_core.tools import tool
from app.core.config import settings

logger = logging.getLogger(__name__)

@tool
def set_system_volume_tool(level: int) -> str:
    """
    Sets the Windows system volume to a specific level (0 to 100).
    """
    try:
        level = max(0, min(100, level))
        from ctypes import cast, POINTER
        from comtypes import CLSCTX_ALL
        from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
        
        devices = AudioUtilities.GetSpeakers()
        interface = devices.Activate(
            IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
        volume = cast(interface, POINTER(IAudioEndpointVolume))
        
        # Scalar volume takes a float from 0.0 to 1.0
        volume.SetMasterVolumeLevelScalar(level / 100.0, None)
        return f"System volume successfully set to {level}%."
    except Exception as e:
        logger.error(f"Failed to set volume: {e}")
        return f"Error setting volume: {e}"

@tool
def take_screenshot_tool() -> str:
    """
    Takes a screenshot of the main desktop and saves it.
    Returns the URL/path to the saved image.
    """
    try:
        from PIL import ImageGrab
        screenshot = ImageGrab.grab()
        
        output_dir = os.path.join(settings.WORKSPACE_DIR, "static", "screenshots")
        os.makedirs(output_dir, exist_ok=True)
        
        filename = f"screenshot_{uuid.uuid4()}.png"
        filepath = os.path.join(output_dir, filename)
        screenshot.save(filepath)
        
        return f"Screenshot saved successfully. URL: /static/screenshots/{filename}"
    except Exception as e:
        logger.error(f"Screenshot failed: {e}")
        return f"Error taking screenshot: {e}"

@tool
def send_notification_tool(title: str, body: str) -> str:
    """
    Sends a native OS desktop notification with a title and body.
    """
    try:
        from plyer import notification
        notification.notify(
            title=title,
            message=body,
            app_name="JARVIS",
            timeout=10
        )
        return "Notification sent to desktop successfully."
    except Exception as e:
        logger.error(f"Notification failed: {e}")
        return f"Error sending notification: {e}"

@tool
def get_clipboard_text_tool() -> str:
    """
    Retrieves the current text content from the system clipboard.
    """
    try:
        import pyperclip
        text = pyperclip.paste()
        if not text:
            return "Clipboard is empty or contains non-text data."
        return f"Clipboard text:\n{text}"
    except Exception as e:
        logger.error(f"Clipboard read failed: {e}")
        return f"Error reading clipboard: {e}"

desktop_tools = [
    set_system_volume_tool,
    take_screenshot_tool,
    send_notification_tool,
    get_clipboard_text_tool
]
