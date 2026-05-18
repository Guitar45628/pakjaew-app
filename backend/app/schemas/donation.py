from pydantic import BaseModel


class DonationCreate(BaseModel):
    name: str
    text: str
    emotion: str
    amount: int
    voice: str = "th-TH-PremwadeeNeural"  # Default to Female Voice


class DonationResponse(BaseModel):
    id: int
    status: str
    message: str


class SettingsUpdate(BaseModel):
    tts_engine: str  # "edge-tts" or "mock-tts"
    is_enabled: bool

