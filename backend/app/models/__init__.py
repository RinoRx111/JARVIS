# Import all models so that SQLModel.metadata.create_all() discovers them
from app.models.user import User
from app.models.conversation import Conversation, Message
from app.models.task import AgentTask
from app.models.audit import AuditLog
from app.models.file import FileMetadata
from app.models.reminder import Reminder
from app.models.analytics import TokenUsageLog
from app.models.agent import AgentConfig

__all__ = ["User", "Conversation", "Message", "AgentTask", "AuditLog", "FileMetadata", "Reminder", "TokenUsageLog", "AgentConfig"]
