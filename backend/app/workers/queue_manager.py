import asyncio
from fastapi import WebSocket

# In-memory queue for donation tasks
donation_queue = asyncio.Queue()


class OBSConnectionManager:
    def __init__(self):
        self.active_connections: set[WebSocket] = set()
        self.audio_done_event = asyncio.Event()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        # ปลดล็อกคิวทันทีหากไม่มีจอเชื่อมต่อหลงเหลืออยู่ ป้องกันคิวค้างคา
        if not self.active_connections:
            self.audio_done_event.set()

    def signal_audio_done(self):
        self.audio_done_event.set()

    async def broadcast_alert(self, payload: dict):
        if not self.active_connections:
            return

        # ยิงอัปเดตแจ้งเตือนไปหาทุกบราวเซอร์/OBS ที่เปิดอยู่พร้อมกัน
        tasks = []
        for ws in list(self.active_connections):
            tasks.append(self.safe_send(ws, payload))
        await asyncio.gather(*tasks, return_exceptions=True)

    async def safe_send(self, ws: WebSocket, payload: dict):
        try:
            await ws.send_json(payload)
        except Exception:
            # ลบการเชื่อมต่อเสียชีวิตออกแบบเรียลไทม์
            self.active_connections.discard(ws)


# Export instance
obs_manager = OBSConnectionManager()


class BroadcastConnectionManager:
    """Senior-Grade Event-Driven WebSocket PubSub for Real-Time Settings Broadcasting"""

    def __init__(self):
        self.active_donors: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_donors.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_donors.discard(websocket)

    async def broadcast_settings(self, tts_engine: str, is_enabled: bool):
        if not self.active_donors:
            return

        # Dispatch updates in parallel across all active client sockets
        payload = {
            "action": "UPDATE_SETTINGS",
            "tts_engine": tts_engine,
            "is_enabled": is_enabled,
        }
        tasks = []
        for ws in list(self.active_donors):
            tasks.append(self.safe_send(ws, payload))
        await asyncio.gather(*tasks, return_exceptions=True)

    async def safe_send(self, ws: WebSocket, payload: dict):
        try:
            await ws.send_json(payload)
        except Exception:
            # Self-healing client removal on connection failure
            self.active_donors.discard(ws)


# Export real-time settings subscriber manager
donor_settings_manager = BroadcastConnectionManager()


class SystemSettings:
    def __init__(self):
        self.tts_engine = "edge-tts"  # "edge-tts" or "mock-tts"
        self.is_enabled = True


# Export settings instance
system_settings = SystemSettings()
