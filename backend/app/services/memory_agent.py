from typing import List
from sqlalchemy.orm import Session
from langchain_core.messages import HumanMessage
import json

from app.services.llm import route_llm
from app.services.memory import memory_service
from app.models.user import User

from app.core.celery_app import celery_app
import asyncio

@celery_app.task(name="memory_agent.run_memory_extraction_agent")
def run_memory_extraction_agent(user_id: int, user_message: str):
    """
    Analyzes the user's message asynchronously to extract persistent factual memories or preferences.
    """
    model = route_llm(task_type="fast")
    
    prompt = f"""
You are the JARVIS Memory Extraction Module.
Analyze the following user input and determine if it contains any facts, preferences, or important context that should be saved to long-term memory for future conversations.

User Input: "{user_message}"

Output ONLY a JSON array of strings containing the facts to be saved. Keep facts concise and generalized.
If there are no facts worth saving, output an empty JSON array: []
Do not include any other text or markdown block formatting.
"""
    try:
        response = asyncio.run(model.ainvoke([HumanMessage(content=prompt)]))
        
        # Clean up possible markdown code blocks from the response
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
            
        facts: List[str] = json.loads(content.strip())
        
        for fact in facts:
            # Check length to prevent storing overly large context blocks
            if fact and len(fact) < 500:
                memory_service.add_user_memory(user_id=user_id, content=fact)
                
    except Exception as e:
        # Silently fail for background memory extraction to not interrupt the main conversational loop
        print(f"Memory Agent Extraction Error: {e}")
