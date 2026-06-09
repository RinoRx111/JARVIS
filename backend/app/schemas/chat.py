from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class MessageBase(BaseModel):
    role: str # "user", "assistant", "system", "tool"
    content: str

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    voice_url: Optional[str] = None
    created_at: datetime

class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: Optional[str] = None
    created_at: datetime
    messages: List[MessageResponse] = []

class ChatRequest(BaseModel):
    content: str
    conversation_id: Optional[int] = None
    voice_output: bool = False # If true, triggers voice generation

class ChatResponse(BaseModel):
    conversation_id: int
    response: str
    voice_url: Optional[str] = None
