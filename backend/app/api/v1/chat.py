import os
import uuid
import logging
import httpx
from typing import Optional
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from sqlmodel import Session, select
from openai import OpenAI

from langchain_core.messages import HumanMessage, AIMessage

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.conversation import Conversation, Message
from app.schemas.chat import ChatRequest, ChatResponse
from app.api.v1.auth import get_current_user
from app.services.agent_orchestrator import agent_graph

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Conversational Chat & Voice"])

# Directory to save generated synthetic audio files
VOICE_OUTPUT_DIR = os.path.join(settings.WORKSPACE_DIR, "static", "voice")
os.makedirs(VOICE_OUTPUT_DIR, exist_ok=True)

# Helper to verify token on WebSocket connection (Bypassed for local Desktop mode)
async def get_ws_user(token: str, db: Session) -> Optional[User]:
    user = db.exec(select(User).where(User.email == "local@jarvis.os")).first()
    if not user:
        from app.core.security import get_password_hash
        user = User(
            email="local@jarvis.os",
            hashed_password=get_password_hash("desktop_mode"),
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

async def synthesize_voice_elevenlabs(text: str) -> Optional[str]:
    """Generates synthetic audio file using ElevenLabs API and returns static url path."""
    if not settings.ELEVENLABS_API_KEY:
        logger.warning("ELEVENLABS_API_KEY is missing. Voice synthesis skipped.")
        return None

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{settings.ELEVENLABS_VOICE_ID}"
    headers = {
        "xi-api-key": settings.ELEVENLABS_API_KEY,
        "content-type": "application/json"
    }
    payload = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
    }

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=payload, headers=headers, timeout=20)
            if res.status_code == 200:
                filename = f"voice_{uuid.uuid4()}.mp3"
                filepath = os.path.join(VOICE_OUTPUT_DIR, filename)
                with open(filepath, "wb") as f:
                    f.write(res.content)
                # Return static mount path
                return f"/static/voice/{filename}"
            else:
                logger.error(f"ElevenLabs TTS failed: {res.text}")
    except Exception as e:
        logger.error(f"TTS synthesis exception: {e}")
    return None

@router.get("/conversations")
async def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches a list of all conversations for the user."""
    conversations = db.exec(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.created_at.desc())
    ).all()
    
    return [
        {
            "id": c.id,
            "title": c.title,
            "created_at": c.created_at.isoformat() if c.created_at else None
        } for c in conversations
    ]

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes a specific conversation and all its messages."""
    conversation = db.exec(select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    )).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    db.delete(conversation)
    db.commit()
    return {"status": "success"}

@router.get("/history")
async def get_chat_history(
    conversation_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches the messages for a specific conversation, or the most recent if not provided."""
    if conversation_id:
        conversation = db.exec(select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )).first()
    else:
        conversation = db.exec(select(Conversation).where(
            Conversation.user_id == current_user.id
        ).order_by(Conversation.created_at.desc())).first()
    
    if not conversation:
        return {"conversation_id": None, "messages": []}
        
    messages = db.exec(select(Message).where(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at.asc())).all()
    
    return {
        "conversation_id": conversation.id,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "voice_url": m.voice_url,
                "created_at": m.created_at.isoformat() if m.created_at else None
            } for m in messages
        ]
    }

@router.post("", response_model=ChatResponse)
async def send_chat_message(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits a conversational request to JARVIS. 
    Triggers LangGraph orchestration nodes and logs all inputs/outputs.
    """
    # 1. Input Validation
    if not payload.content or len(payload.content.strip()) == 0:
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")
    if len(payload.content) > 4000:
        raise HTTPException(status_code=400, detail="Message content exceeds maximum length of 4000 characters.")
    
    # 2. Load or create conversation session
    conv_id = payload.conversation_id
    if conv_id:
        conversation = db.exec(select(Conversation).where(
            Conversation.id == conv_id, 
            Conversation.user_id == current_user.id
        )).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation session not found")
    else:
        conversation = Conversation(user_id=current_user.id, title=payload.content[:40])
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # 2. Log user message to database
    user_msg = Message(conversation_id=conversation.id, role="user", content=payload.content)
    db.add(user_msg)
    db.commit()

    # 3. Retrieve prior context logs to inject into state
    db_messages = db.exec(select(Message).where(Message.conversation_id == conversation.id).order_by(Message.created_at)).all()
    # Convert past messages into LangChain objects
    langchain_history = []
    # Fetch last 10 messages for state context
    for msg in db_messages[-10:]:
        if msg.role == "user":
            langchain_history.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            langchain_history.append(AIMessage(content=msg.content))

    # 4. Invoke the LangGraph Agent Orchestrator Graph
    inputs = {
        "messages": langchain_history,
        "task_type": "general",
        "user_id": current_user.id,
        "error_count": 0,
        "tool_call_depth": 0
    }
    
    try:
        final_state = await agent_graph.ainvoke(inputs)
        # Final response is the content of the last assistant message
        agent_reply = final_state["messages"][-1].content
    except Exception as err:
        import traceback
        logger.error(f"Agent Orchestrator graph execution crash: {err}\n{traceback.format_exc()}")
        agent_reply = f"API Error: {repr(err)}"

    # 5. Synthesize voice if requested
    voice_url = None
    if payload.voice_output:
        voice_url = await synthesize_voice_elevenlabs(agent_reply)

    # 6. Save agent response to database
    assistant_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=agent_reply,
        voice_url=voice_url
    )
    db.add(assistant_msg)
    db.commit()

    # 7. Check if we should save a memory fact in background
    try:
        from app.services.memory_agent import run_memory_extraction_agent
        run_memory_extraction_agent.delay(current_user.id, payload.content)
    except Exception as e:
        logger.warning(f"Failed to queue memory extraction (Celery broker may be offline): {e}")

    return {
        "conversation_id": conversation.id,
        "response": agent_reply,
        "voice_url": voice_url
    }

@router.websocket("/ws")
async def websocket_chat_endpoint(websocket: WebSocket, token: str, db: Session = Depends(get_db)):
    """
    WebSocket endpoint. Streams audio/text inputs directly, transcribes 
    using Whisper, invokes Agent planning, and returns synthetic speech.
    """
    await websocket.accept()
    
    # Validate token
    user = await get_ws_user(token, db)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    logger.info(f"WebSocket voice connection opened for user ID: {user.id}")

    try:
        while True:
            # Receive text or audio binary payload
            data = await websocket.receive()
            
            # 1. Handlers for raw voice bytes input (Audio Streaming)
            if "bytes" in data:
                audio_bytes = data["bytes"]
                
                # Write audio chunk to temporary file
                temp_audio_path = os.path.join(settings.WORKSPACE_DIR, f"temp_ws_{uuid.uuid4()}.wav")
                with open(temp_audio_path, "wb") as f:
                    f.write(audio_bytes)
                
                # Transcribe using OpenAI Whisper API
                transcription = ""
                if settings.OPENAI_API_KEY:
                    try:
                        client = OpenAI(api_key=settings.OPENAI_API_KEY)
                        with open(temp_audio_path, "rb") as audio_file:
                            transcript_res = client.audio.transcriptions.create(
                                model="whisper-1",
                                file=audio_file
                            )
                            transcription = transcript_res.text
                    except Exception as trans_err:
                        logger.error(f"Whisper transcription error: {trans_err}")
                
                # Delete temporary audio file
                if os.path.exists(temp_audio_path):
                    os.remove(temp_audio_path)

                if not transcription:
                    await websocket.send_json({"error": "Failed to transcribe incoming audio."})
                    continue
                
                # Send transcribed text back to client first
                await websocket.send_json({"type": "transcription", "text": transcription})
                
                # Run the conversational pipeline with the transcribed text (Voice chunk doesn't carry conversation_id easily in raw bytes, so it defaults to None/new)
                await _ws_process_response(websocket, transcription, user, db, None)
            
            elif "text" in data:
                raw_text = data["text"]
                conversation_id = None
                try:
                    import json
                    parsed = json.loads(raw_text)
                    text_input = parsed.get("text", raw_text)
                    conversation_id = parsed.get("conversation_id")
                except Exception:
                    text_input = raw_text
                await _ws_process_response(websocket, text_input, user, db, conversation_id)
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket connection closed for user ID: {user.id}")
    except Exception as e:
        logger.error(f"WebSocket runtime exception: {e}")

async def _ws_process_response(websocket: WebSocket, prompt: str, user: User, db: Session, conversation_id: Optional[int] = None) -> None:
    """Helper method to run the orchestrator loop, stream tokens, and synthesize speech."""
    if not prompt or len(prompt.strip()) == 0:
        await websocket.send_json({"error": "Message content cannot be empty."})
        return
    if len(prompt) > 4000:
        await websocket.send_json({"error": "Message content exceeds maximum length of 4000 characters."})
        return

    # Create static conversation for web socket streaming events
    conversation = None
    if conversation_id:
        conversation = db.exec(select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id
        )).first()

    if not conversation:
        conversation = Conversation(user_id=user.id, title=prompt[:40] if prompt else "New Chat")
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Launch memory extraction agent as an independent background task
    try:
        from app.services.memory_agent import run_memory_extraction_agent
        run_memory_extraction_agent.delay(user.id, prompt)
    except Exception as e:
        logger.warning(f"Failed to queue memory extraction (Celery broker may be offline): {e}")

    # Retrieve prior context logs to inject into state
    db_messages = db.exec(select(Message).where(Message.conversation_id == conversation.id).order_by(Message.created_at)).all()
    langchain_history = []
    for msg in db_messages[-10:]:
        if msg.role == "user":
            langchain_history.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            langchain_history.append(AIMessage(content=msg.content))
    langchain_history.append(HumanMessage(content=prompt))

    # Invoke agent graph
    inputs = {
        "messages": langchain_history,
        "task_type": "general",
        "user_id": user.id,
        "error_count": 0,
        "tool_call_depth": 0
    }
    
    agent_reply = ""
    try:
        # Stream events from LangGraph
        async for event in agent_graph.astream_events(inputs, version="v2"):
            kind = event["event"]
            
            # Stream text tokens directly to client
            if kind == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if hasattr(chunk, "content") and chunk.content and isinstance(chunk.content, str):
                    await websocket.send_json({"type": "token", "token": chunk.content})
                    agent_reply += chunk.content
                    
            # Let the UI know when a tool is being called
            elif kind == "on_tool_start":
                tool_name = event.get("name", "tool")
                await websocket.send_json({"type": "status", "message": f"Invoking sub-routine: {tool_name}..."})
                
    except Exception as err:
        import traceback
        logger.error(f"WebSocket graph streaming error: {err}\n{traceback.format_exc()}")
        agent_reply = f"API Error: {repr(err)}"

    # If the response somehow ended up empty, fallback to the final state message
    if not agent_reply:
        try:
            final_state = await agent_graph.ainvoke(inputs)
            agent_reply = final_state["messages"][-1].content
            await websocket.send_json({"type": "token", "token": agent_reply})
        except Exception as err:
            import traceback
            logger.error(f"Fallback graph execution crash: {err}\n{traceback.format_exc()}")
            agent_reply = f"API Error: {repr(err)}"

    # Synthesize audio speech
    voice_url = await synthesize_voice_elevenlabs(agent_reply)

    # Save messages to database
    db.add(Message(conversation_id=conversation.id, role="user", content=prompt))
    db.add(Message(conversation_id=conversation.id, role="assistant", content=agent_reply, voice_url=voice_url))
    db.commit()

    # Send final completed packet
    await websocket.send_json({
        "type": "agent_response",
        "text": agent_reply,
        "voice_url": voice_url
    })
