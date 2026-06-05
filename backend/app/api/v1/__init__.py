from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.chat import router as chat_router
from app.api.v1.agents import router as agents_router
from app.api.v1.files import router as files_router
from app.api.v1.memory import router as memory_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(chat_router)
router.include_router(agents_router)
router.include_router(files_router)
router.include_router(memory_router)
