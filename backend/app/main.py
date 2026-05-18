import asyncio
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.donate import router as donate_router
from app.api.v1.overlay import router as overlay_router
from app.workers.tts_worker import start_tts_worker

# Load environment variables from .env file
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start background worker when server starts
    task = asyncio.create_task(start_tts_worker())
    yield
    # Cancel task on shutdown
    task.cancel()


app = FastAPI(title="PakJaew Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(donate_router)
app.include_router(overlay_router)
