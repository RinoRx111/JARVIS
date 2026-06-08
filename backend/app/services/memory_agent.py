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
Additionally, extract structured profile attributes if mentioned (e.g., Name, Timezone, Occupation, Preferences, Communication Style, Frequently Used Tools).

User Input: "{user_message}"

Output ONLY a JSON object with two keys:
1. "facts": An array of strings containing general facts to be saved.
2. "profile": An object containing key-value pairs of extracted profile attributes.

Keep facts concise and generalized. If there are no facts or profile traits worth saving, output empty arrays/objects.
Output ONLY the JSON object. Do not include any markdown block formatting.
"""
    try:
        response = asyncio.run(model.ainvoke([HumanMessage(content=prompt)]))
        
        # Clean up possible markdown code blocks from the response
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
            
        data = json.loads(content.strip())
        facts = data.get("facts", [])
        profile = data.get("profile", {})
        
        for fact in facts:
            if fact and isinstance(fact, str) and len(fact) < 500:
                memory_service.add_user_memory(user_id=user_id, content=fact)
                
        for key, value in profile.items():
            if value and isinstance(value, str) and len(value) < 500:
                trait = f"{key}: {value}"
                memory_service.add_profile_entry(user_id=user_id, trait=trait)
                
    except Exception as e:
        # Silently fail for background memory extraction to not interrupt the main conversational loop
        print(f"Memory Agent Extraction Error: {e}")
