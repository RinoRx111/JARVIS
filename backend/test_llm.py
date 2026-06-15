import asyncio
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path="../.env")

api_key = os.getenv("GROQ_API_KEY")

model = ChatOpenAI(
    model="llama-3.3-70b-versatile",
    temperature=0.7,
    openai_api_key=api_key,
    openai_api_base="https://api.groq.com/openai/v1"
)

async def main():
    try:
        print("Invoking ChatOpenAI pointed to Groq...")
        response = await model.ainvoke([HumanMessage(content="Hello, are you online?")])
        print("SUCCESS!")
        print("Response:", response.content)
    except Exception as e:
        print("FAILED!")
        print("Error details:", type(e), e)

if __name__ == "__main__":
    asyncio.run(main())
