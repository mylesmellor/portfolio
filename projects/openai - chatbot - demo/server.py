import os
import time
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse

from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Session store with expiry ---
MAX_SESSIONS = 1000
SESSION_TTL_SECONDS = 3600  # 1 hour
MAX_MESSAGE_LENGTH = 2000

# session_id -> {"messages": [...], "last_used": float}
SESSIONS: Dict[str, dict] = {}


def _cleanup_sessions() -> None:
    """Evict expired sessions. If still at capacity, evict the oldest."""
    now = time.time()
    expired = [
        sid for sid, s in SESSIONS.items()
        if now - s["last_used"] > SESSION_TTL_SECONDS
    ]
    for sid in expired:
        del SESSIONS[sid]

    if len(SESSIONS) >= MAX_SESSIONS:
        oldest = min(SESSIONS, key=lambda sid: SESSIONS[sid]["last_used"])
        del SESSIONS[oldest]


def build_system_prompt(mode: str, faq_context: Optional[str]) -> str:
    if mode == "faq":
        ctx = (faq_context or "").strip()
        return (
            "You are a strict FAQ bot.\n"
            "You must answer ONLY using the provided FAQ_CONTEXT.\n"
            "If the answer is not explicitly in FAQ_CONTEXT, reply exactly: \"I don't know.\"\n"
            "Do not guess. Do not add extra facts.\n"
            "If the user asks for anything unsafe/illegal, refuse.\n\n"
            f"FAQ_CONTEXT:\n{ctx}\n"
        )

    if mode == "strict":
        return (
            "You are a strict assistant.\n"
            "Goals: be correct, brief, and useful.\n"
            "Output rules:\n"
            "- Use bullet points by default.\n"
            "- Keep answers under ~8 bullets unless the user explicitly asks for more.\n"
            "- If you need clarification, ask exactly ONE question, then stop.\n"
            "- Do not include filler or long preambles.\n"
            "- If you do not know, say: \"I don't know.\"\n"
            "- Refuse unsafe or illegal requests politely.\n"
        )

    # default assistant
    return (
        "You are a helpful assistant.\n"
        "If you do not know the answer, say \"I don't know.\"\n"
        "Refuse unsafe or illegal requests politely.\n"
    )


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    mode: Literal["assistant", "faq", "strict"] = "assistant"
    faq_context: Optional[str] = None


class ChatResponse(BaseModel):
    session_id: str
    reply: str


@app.get("/")
def index():
    return FileResponse(Path(__file__).parent / "index.html")


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    user_text = (req.message or "").strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="Empty message")
    if len(user_text) > MAX_MESSAGE_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Message too long (max {MAX_MESSAGE_LENGTH} characters)",
        )

    # In FAQ mode, require some context (otherwise every answer should be "I don't know.")
    if req.mode == "faq" and not (req.faq_context or "").strip():
        return ChatResponse(
            session_id=req.session_id or str(uuid.uuid4()),
            reply="I don't know."
        )

    _cleanup_sessions()

    session_id = req.session_id or str(uuid.uuid4())
    session = SESSIONS.get(session_id, {"messages": [], "last_used": 0})
    history = session["messages"]

    system_prompt = build_system_prompt(req.mode, req.faq_context)

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history[-10:])
    messages.append({"role": "user", "content": user_text})

    response = client.responses.create(
        model="gpt-4o-mini",
        input=messages
    )

    reply = response.output_text or "I don't know."

    # Save memory (per session)
    history.append({"role": "user", "content": user_text})
    history.append({"role": "assistant", "content": reply})
    SESSIONS[session_id] = {"messages": history, "last_used": time.time()}

    return ChatResponse(session_id=session_id, reply=reply)


@app.post("/chat-stream")
def chat_stream(req: ChatRequest):
    user_text = (req.message or "").strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="Empty message")
    if len(user_text) > MAX_MESSAGE_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Message too long (max {MAX_MESSAGE_LENGTH} characters)",
        )

    # In FAQ mode, require some context (otherwise every answer should be "I don't know.")
    if req.mode == "faq" and not (req.faq_context or "").strip():
        def immediate():
            yield "I don't know."
        return StreamingResponse(immediate(), media_type="text/plain")

    _cleanup_sessions()

    session_id = req.session_id or str(uuid.uuid4())
    session = SESSIONS.get(session_id, {"messages": [], "last_used": 0})
    history = session["messages"]

    system_prompt = build_system_prompt(req.mode, req.faq_context)

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history[-10:])
    messages.append({"role": "user", "content": user_text})

    def event_generator():
        full_reply = ""
        yield ""  # kick-start streaming for some clients

        response_stream = client.responses.create(
            model="gpt-4o-mini",
            input=messages,
            stream=True,
        )

        def handle_events(stream):
            nonlocal full_reply
            for event in stream:
                if getattr(event, "type", None) == "response.output_text.delta":
                    chunk = event.delta
                    full_reply += chunk
                    yield chunk

        # Some SDK versions return a context manager (ResponseStreamManager)
        if hasattr(response_stream, "__enter__"):
            with response_stream as stream:
                for chunk in handle_events(stream):
                    yield chunk
        else:
            for chunk in handle_events(response_stream):
                yield chunk

        # Save memory at the end
        history.append({"role": "user", "content": user_text})
        history.append({"role": "assistant", "content": full_reply})
        SESSIONS[session_id] = {"messages": history, "last_used": time.time()}

    return StreamingResponse(event_generator(), media_type="text/plain")
