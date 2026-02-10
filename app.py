import uuid
import httpx
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional

app = FastAPI(title="AI Article Processor Backend")

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
N8N_WEBHOOK_URL ="https://server3.automationlearners.pro/webhook/95159d87-5cf2-4091-a4b0-e34045009fcd"
class ArticleRequest(BaseModel):
    email: EmailStr
    article_url: HttpUrl

class ProcessResponse(BaseModel):
    status: str
    session_id: str
    message: str

async def forward_to_n8n_with_retry(payload: dict):
    """
    Forwards payload to n8n with exponential backoff retry logic.
    """
    retries = [1, 2, 4, 8, 16]
    async with httpx.AsyncClient() as client:
        for wait_time in retries:
            try:
                response = await client.post(N8N_WEBHOOK_URL, json=payload, timeout=10.0)
                response.raise_for_status()
                return True
            except (httpx.RequestError, httpx.HTTPStatusError):
                if wait_time == 16: # Final attempt
                    return False
                await asyncio.sleep(wait_time)
    return False

@app.post("/process-article", response_model=ProcessResponse)
async def process_article(request: ArticleRequest):
    # 1. Generate unique session ID
    session_id = str(uuid.uuid4())
    
    # 2. Prepare payload for n8n
    n8n_payload = {
        "email": str(request.email),
        "article_url": str(request.article_url),
        "session_id": session_id
    }
    
    # 3. Forward to n8n
    success = await forward_to_n8n_with_retry(n8n_payload)
    
    if not success:
        raise HTTPException(
            status_code=502, 
            detail="Failed to reach n8n automation server after several attempts."
        )
    
    return {
        "status": "success",
        "session_id": session_id,
        "message": "Data successfully sent to n8n processing queue."
    }

@app.get("/health")
def health_check():
    return {"status": "online"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)