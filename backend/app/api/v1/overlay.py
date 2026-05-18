from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.workers.queue_manager import obs_manager, donor_settings_manager, system_settings

router = APIRouter(prefix="/v1/ws", tags=["Overlay"])


@router.websocket("/overlay")
async def websocket_overlay(websocket: WebSocket):
    """Handle WebSocket connection for the OBS Overlay page."""
    await obs_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "DONE":
                obs_manager.signal_audio_done()
    except WebSocketDisconnect:
        obs_manager.disconnect(websocket)


@router.websocket("/settings")
async def websocket_settings(websocket: WebSocket):
    """Handle real-time settings subscription for clients."""
    await donor_settings_manager.connect(websocket)
    try:
        await websocket.send_json({
            "action": "UPDATE_SETTINGS",
            "tts_engine": system_settings.tts_engine,
            "is_enabled": system_settings.is_enabled
        })
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        donor_settings_manager.disconnect(websocket)
