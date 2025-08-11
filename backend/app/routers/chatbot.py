from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv
import json

# This is a good practice, but the main.py should also load them.
load_dotenv()

router = APIRouter()

class Message(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    chatHistory: list[Message]

API_KEY = os.getenv("GEMINI_API_KEY", "")

@router.post("/chat", status_code=status.HTTP_200_OK)
async def chat_with_gemini(request: ChatRequest):
    """
    Endpoint to handle chat requests and get responses from the Gemini API.
    """
    if not API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set in environment variables.")

    # A crucial fix: Filter out the initial model message from the chat history
    # The Gemini API expects the conversation to start with a 'user' role.
    cleaned_chat_history = [
        {"role": msg.role, "parts": [{"text": msg.text}]} 
        for msg in request.chatHistory 
        if msg.role != 'model'
    ]

    # If for some reason there are no user messages, raise an error
    if not cleaned_chat_history:
        raise HTTPException(status_code=400, detail="No user messages found in the request.")

    api_payload = { "contents": cleaned_chat_history }
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key={API_KEY}"

    try:
        response = requests.post(url, json=api_payload)
        
        if response.status_code != 200:
            print(f"API Error Response Body: {response.text}")
            error_detail = "Failed to communicate with Gemini API. Check the server logs for details."
            try:
                error_json = response.json()
                error_detail = error_json.get('error', {}).get('message', error_detail)
            except json.JSONDecodeError:
                pass
            raise HTTPException(
                status_code=response.status_code, 
                detail=f"API request failed: {error_detail}"
            )
        
        response_data = response.json()
        
        if (response_data.get('candidates') and 
            response_data['candidates'][0].get('content') and 
            response_data['candidates'][0]['content'].get('parts')):
            
            bot_message = response_data['candidates'][0]['content']['parts'][0]['text']
            return {"message": bot_message}
        else:
            raise HTTPException(status_code=500, detail="Unexpected response structure from Gemini API.")
    
    except requests.exceptions.RequestException as e:
        print(f"Request to Gemini API failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to communicate with Gemini API: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred.")
