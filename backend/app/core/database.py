from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

# Determine if connecting to SQLite database to apply threading workaround
connect_args = {}
db_url = settings.get_database_url()
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Create SQLModel engine
engine = create_engine(db_url, echo=settings.DEBUG, connect_args=connect_args)

# Dependency helper to yield sessions in API routes using SQLModel Session
def get_db():
    """FastAPI dependency that provides a SQLModel Session."""
    with Session(engine) as session:
        yield session
