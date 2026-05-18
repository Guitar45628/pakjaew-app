from fastapi import APIRouter, HTTPException
from app.schemas.donation import DonationCreate, DonationResponse, SettingsUpdate
from app.workers.queue_manager import donation_queue, system_settings, donor_settings_manager

router = APIRouter(prefix="/v1/donate", tags=["Donation"])


@router.post("/submit", response_model=DonationResponse)
async def submit_donation(payload: DonationCreate):
    """Submit a new donation to the processing queue."""
    if not system_settings.is_enabled:
        raise HTTPException(
            status_code=400,
            detail="The donation system is temporarily disabled."
        )

    donation_dict = payload.model_dump()
    donation_dict["id"] = 1  # Mock primary key assignment

    await donation_queue.put(donation_dict)

    return DonationResponse(
        id=donation_dict["id"],
        status="success",
        message="ส่งข้อความปากแจ๋วเข้าคิวเรียบร้อย! เตรียมฟังเสียงบนจอได้เลย 🎙️✨"
    )


@router.get("/settings")
async def get_settings():
    """Retrieve the current global system settings."""
    return {
        "tts_engine": system_settings.tts_engine,
        "is_enabled": system_settings.is_enabled
    }


@router.post("/settings")
async def update_settings(payload: SettingsUpdate):
    """Update global system settings and broadcast updates to connected clients."""
    system_settings.tts_engine = payload.tts_engine
    system_settings.is_enabled = payload.is_enabled
    
    await donor_settings_manager.broadcast_settings(
        tts_engine=payload.tts_engine,
        is_enabled=payload.is_enabled
    )
    
    return {
        "status": "success",
        "message": f"System settings updated. Enabled: {payload.is_enabled}"
    }
