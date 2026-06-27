import os
# Configure database URL env variable to use a file-based SQLite DB before loading application modules
os.environ["DATABASE_URL"] = "sqlite:///test.db"
os.environ["TESTING"] = "True"
os.environ["CLERK_JWKS_URL"] = "https://clerk.example.com/.well-known/jwks.json"
os.environ["CLERK_ISSUER"] = "https://clerk.issuer.com"
os.environ["CLERK_SECRET_KEY"] = "mock_secret_key"
os.environ["ENCRYPTION_KEY"] = "MCxNAJkzIsnUKYnKLlqwt3Fkb62PJvpZYEUNgTfMmAw="

import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, select
from app.main import app
from app.core.database import get_db, engine
from app.api.v1.auth import get_current_user
from app.models.user import User

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

    def override_get_current_user():
        user = session.exec(select(User)).first()
        if not user:
            user = User(
                email="testuser@example.com",
                clerk_user_id="clerk_test_123",
                full_name="Test User",
                nickname="Tester",
                is_active=True,
                role="admin"
            )
            session.add(user)
            session.commit()
            session.refresh(user)
        return user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
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
