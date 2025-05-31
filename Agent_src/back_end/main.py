# main.py
"""
This is the file for all the microservices, like user authentification, 
sending chat info to and from client (Front_end)
"""
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from jose import jwt, JWTError
import time

from llm_engine import PromptEngine
from dotenv import load_dotenv

load_dotenv()  # reads .env into os.environ

# -----------------------------------------------------------------------------
# 1) Configuration
# -----------------------------------------------------------------------------
SECRET_KEY = "your‐very‐secret‐key"      # In production, pull from an environment variable!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SECONDS = 3600       # Token validity: 1 hour

# -----------------------------------------------------------------------------
# 2) App & Security setup
# -----------------------------------------------------------------------------
app = FastAPI()

# --- CORS Middleware -------------------------------------------
# Allow our React dev server (http://localhost:3000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # front-end origin
    allow_credentials=True,
    allow_methods=["*"],                      # GET, POST, etc.
    allow_headers=["*"],                      # Authorization, Content-Type, etc.
)
# ---------------------------------------------------------------

security = HTTPBearer()  # Use HTTP Bearer tokens (JWT)

# Activate the LLM class in 'llm_engine' file
engine = PromptEngine()

# -----------------------------------------------------------------------------
# 3) Pydantic models for request & response bodies
# -----------------------------------------------------------------------------
class LoginData(BaseModel):
    username: str
    password: str

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

# -----------------------------------------------------------------------------
# 4) `/login` endpoint
#    - Verifies hard-coded credentials
#    - Returns a signed JWT if valid
# -----------------------------------------------------------------------------
@app.post("/login")
def login(data: LoginData):
    # Replace this with real user lookup in production
    if data.username == "user" and data.password == "pwd":
        expire = int(time.time()) + ACCESS_TOKEN_EXPIRE_SECONDS
        token = jwt.encode(
            {"sub": data.username, "exp": expire},
            SECRET_KEY,
            algorithm=ALGORITHM
        )
        return {"access_token": token}
    # Invalid credentials → 400 Bad Request
    raise HTTPException(status_code=400, detail="Invalid credentials")

# -----------------------------------------------------------------------------
# 5) Dependency that validates the JWT on protected routes
# -----------------------------------------------------------------------------
def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security)
):
    token = creds.credentials  # Extract raw JWT from the header
    try:
        # Decode & verify signature and expiry
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user: str = payload.get("sub")
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return user
    except JWTError:
        # Any JWT validation errors land here
        raise HTTPException(status_code=401, detail="Token validation error")

# -----------------------------------------------------------------------------
# 6) `/chat` endpoint
#    - Protected by JWT
#    - Forwards the user prompt to PromptEngine
#    - Returns the LLM’s reply
# -----------------------------------------------------------------------------
@app.post("/chat", response_model=ChatResponse) #creates a '/chat' record in the server log
def chat(
    req: ChatRequest,
    user: str = Depends(get_current_user)  # ensures valid JWT
):
    # At this point, `user` is the username from the token
    reply = engine.generate_report(req.message)
    return ChatResponse(reply=reply)
