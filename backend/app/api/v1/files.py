import os
import logging
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, BackgroundTasks
from sqlmodel import Session, select

from app.core.config import settings
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.file import FileMetadata
from app.services.memory import memory_service
from app.services.file_ingest import ingest_file_in_background
from app.tools.registry import _get_safe_path

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/files", tags=["File Management"])

@router.post("/upload", response_model=FileMetadata, status_code=status.HTTP_201_CREATED)
async def upload_workspace_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Uploads a file to the secure workspace directory, registers its metadata in the DB,
    and initiates asynchronous text parsing and ChromaDB ingestion in the background.
    """
    try:
        filename = file.filename
        safe_filepath = _get_safe_path(filename)
        
        # Save file to disk
        with open(safe_filepath, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        logger.info(f"File saved to safe path: {safe_filepath}")

        # Create FileMetadata entry in database
        file_record = FileMetadata(
            user_id=current_user.id,
            filename=filename,
            file_path=safe_filepath,
            content_type=file.content_type or "application/octet-stream",
            file_size_bytes=len(content),
            status="pending"
        )
        db.add(file_record)
        db.commit()
        db.refresh(file_record)

        # Trigger asynchronous ingestion background task
        background_tasks.add_task(
            ingest_file_in_background,
            settings.get_database_url(),
            file_record.id
        )

        return file_record

    except Exception as e:
        logger.error(f"File upload error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.get("/list", response_model=List[FileMetadata])
def list_workspace_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists all files uploaded by the current user from the database."""
    try:
        statement = select(FileMetadata).where(FileMetadata.user_id == current_user.id)
        results = db.exec(statement).all()
        return results
    except Exception as e:
        logger.error(f"List files error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve file list.")

@router.get("/read")
def read_workspace_file(
    filepath: str,
    current_user: User = Depends(get_current_user)
):
    """Reads raw text content from files in workspace."""
    try:
        safe_path = _get_safe_path(filepath)
        if not os.path.exists(safe_path) or os.path.isdir(safe_path):
            raise HTTPException(status_code=404, detail="File not found")
            
        with open(safe_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        return {"filepath": filepath, "content": content}
    except ValueError as ve:
        raise HTTPException(status_code=403, detail=str(ve))
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{file_id}/status", response_model=FileMetadata)
def get_file_status(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves ingestion status and details of a specific file."""
    file_record = db.get(FileMetadata, file_id)
    if not file_record or file_record.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="File not found")
    return file_record

@router.get("/{file_id}/query")
def query_file_contents(
    file_id: int,
    query: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Performs semantic similarity search over text chunks of a specific ingested file."""
    file_record = db.get(FileMetadata, file_id)
    if not file_record or file_record.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="File not found")
    
    if file_record.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"File ingestion is not complete. Current status: {file_record.status}"
        )

    chunks = memory_service.search_document_chunks(file_id=str(file_id), query=query, limit=5)
    
    # Filter chunks to ensure security (owner check)
    secured_chunks = []
    for chunk in chunks:
        meta = chunk.get("metadata", {})
        if meta.get("owner_id") == current_user.id:
            secured_chunks.append(chunk)

    return {
        "file_id": file_id,
        "filename": file_record.filename,
        "query": query,
        "matches": secured_chunks
    }
