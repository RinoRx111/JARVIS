import os
# Configure database URL env variable to use a file-based SQLite DB before loading application modules
os.environ["DATABASE_URL"] = "sqlite:///test.db"
os.environ["TESTING"] = "True"

import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session
from app.main import app
from app.core.database import get_db, engine

@pytest.fixture(name="session")
def session_fixture() -> Generator[Session, None, None]:
    # Clear metadata and recreate tables to ensure clean DB for each test run
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    # Cleanup connection pool to release file locks on test.db
    engine.dispose()

@pytest.fixture(name="client")
def client_fixture(session: Session) -> Generator[TestClient, None, None]:
    def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()

@pytest.fixture(scope="session", autouse=True)
def cleanup_test_db_file():
    yield
    # Remove the test database file after all tests finish
    if os.path.exists("test.db"):
        try:
            os.remove("test.db")
        except Exception:
            pass
