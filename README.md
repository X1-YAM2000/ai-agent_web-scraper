# ai_agent FastAPI forwarder

This small FastAPI app exposes a POST `/forward` endpoint which accepts JSON:

```json
{
  "email": "user@example.com",
  "article_url": "https://example.com/article",
  "session_id": "<uuid-or-id>"
}
```

It forwards the received payload to an n8n webhook:

`https://server3.automationlearners.pro/webhook/95159d87-5cf2-4091-a4b0-e34045009fcd`

Run locally:

- Create a venv and install dependencies:
  ```bash
  python -m venv .venv
  .venv\Scripts\activate    # Windows
  pip install -r requirements.txt
  ```

- Start the server:
  ```bash
  python app.py
  ```

Test with curl:

```bash
curl -X POST http://127.0.0.1:8001/forward \
  -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","article_url":"https://a.com","session_id":"123"}'
```
For Live Application:

---web_url

backend_url : http://localhost:8000/docs#/
loveable_app_url: https://web-scarping-m14-siyam.lovable.app/

---