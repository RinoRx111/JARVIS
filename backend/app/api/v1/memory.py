import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.services.memory import memory_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/memory", tags=["Long-Term Memory"])

@router.get("/search")
def search_long_term_memories(
    query: str,
    limit: int = 5,
    current_user: User = Depends(get_current_user)
):
    """Semantically search user's long-term memory store for stored facts or preferences."""
    results = memory_service.search_user_memories(user_id=current_user.id, query=query, limit=limit)
    return {"query": query, "results": results}

@router.post("/add", status_code=status.HTTP_201_CREATED)
def add_user_preference_memory(
    fact: str,
    current_user: User = Depends(get_current_user)
):
    """Manually registers a new fact or preference into long-term vector storage."""
    if not fact.strip():
        raise HTTPException(status_code=400, detail="Memory fact content cannot be empty.")
    
    doc_id = memory_service.add_user_memory(
        user_id=current_user.id,
        content=fact.strip(),
        metadata={"added_via": "api_endpoint"}
    )
    
    return {"status": "success", "memory_id": doc_id, "message": "Fact stored in vector database."}

@router.delete("/delete/{memory_id}")
def delete_user_memory(
    memory_id: str,
    current_user: User = Depends(get_current_user)
):
    """Deletes a designated record from the vector index."""
    if not memory_service.user_memory_collection:
        raise HTTPException(status_code=500, detail="Memory store is unavailable.")
        
    try:
        # Verify ownership by checking metadata match in collection query
        # Since standard Chroma deletes by ID, we query it first to check user_id
        res = memory_service.user_memory_collection.get(ids=[memory_id])
        if not res or not res["ids"]:
            raise HTTPException(status_code=404, detail="Memory chunk not found.")
            
        metadata = res["metadatas"][0]
        if metadata.get("user_id") != current_user.id:
            raise HTTPException(status_code=403, detail="Permission denied: not owner of memory.")
            
        memory_service.user_memory_collection.delete(ids=[memory_id])
        return {"status": "success", "message": f"Memory {memory_id} deleted."}
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Memory deletion failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete memory: {str(e)}")
