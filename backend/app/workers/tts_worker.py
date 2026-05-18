import asyncio
import base64
import os
import struct
import edge_tts
from google import genai
from google.genai import types
from app.workers.queue_manager import donation_queue, obs_manager, system_settings


def parse_audio_mime_type(mime_type: str) -> dict:
    """Parse bits_per_sample and sample_rate from audio MIME type string."""
    bits_per_sample = 16
    rate = 24000

    parts = mime_type.split(";")
    for param in parts:
        param = param.strip()
        if param.lower().startswith("rate="):
            try:
                rate_str = param.split("=", 1)[1]
                rate = int(rate_str)
            except (ValueError, IndexError):
                pass
        elif param.startswith("audio/L") or "L" in param:
            try:
                clean_param = param.replace("audio/", "")
                if clean_param.startswith("L"):
                    bits_per_sample = int(clean_param.split("L", 1)[1])
            except (ValueError, IndexError):
                pass

    return {"bits_per_sample": bits_per_sample, "rate": rate}


def convert_to_wav(audio_data: bytes, mime_type: str) -> bytes:
    """Prepend a standard WAV header to raw PCM audio data."""
    parameters = parse_audio_mime_type(mime_type)
    bits_per_sample = parameters["bits_per_sample"]
    rate = parameters["rate"]
    num_channels = 1
    data_size = len(audio_data)
    bytes_per_sample = bits_per_sample // 8
    block_align = num_channels * bytes_per_sample
    byte_rate = rate * block_align
    chunk_size = 36 + data_size

    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",          # ChunkID
        chunk_size,       # ChunkSize
        b"WAVE",          # Format
        b"fmt ",          # Subchunk1ID
        16,               # Subchunk1Size
        1,                # AudioFormat
        num_channels,     # NumChannels
        rate,             # SampleRate
        byte_rate,        # ByteRate
        block_align,      # BlockAlign
        bits_per_sample,  # BitsPerSample
        b"data",          # Subchunk2ID
        data_size         # Subchunk2Size
    )
    return header + audio_data


async def generate_gemini_voice(text: str, emotion: str) -> str:
    """Generate expressive Thai speech audio using Gemini 3.1 Flash TTS."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not defined in system environment.")
        
    client = genai.Client(api_key=api_key)
    
    prompt = f"Please read the following text with {emotion} emotion: {text}"
    if emotion == "angry":
        prompt = f"Please shout or speak with extreme anger: {text}"
    elif emotion == "sad":
        prompt = f"Please speak with a very sad, sobbing and lonely voice: {text}"
    elif emotion == "happy":
        prompt = f"Please speak with an extremely happy, excited, and laughing voice: {text}"
    elif emotion == "cool":
        prompt = f"Please speak with a very calm, cool, deep, and smooth voice: {text}"

    voice_name = "Aoede" if emotion in ["happy", "normal"] else "Zephyr"

    def call_gemini():
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=prompt),
                ],
            ),
        ]
        
        config = types.GenerateContentConfig(
            temperature=0.8,
            response_modalities=["audio"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=voice_name
                    )
                )
            ),
        )
        
        raw_audio = b""
        mime_type = "audio/L16;rate=24000"
        
        for chunk in client.models.generate_content_stream(
            model="gemini-3.1-flash-tts-preview",
            contents=contents,
            config=config,
        ):
            if chunk.parts is None:
                continue
            for part in chunk.parts:
                if part.inline_data and part.inline_data.data:
                    raw_audio += part.inline_data.data
                    if part.inline_data.mime_type:
                        mime_type = part.inline_data.mime_type
                        
        if not raw_audio:
            raise ValueError("No audio content received from Gemini TTS.")
            
        return convert_to_wav(raw_audio, mime_type)

    loop = asyncio.get_running_loop()
    wav_data = await loop.run_in_executor(None, call_gemini)
    
    base64_audio = base64.b64encode(wav_data).decode("utf-8")
    return f"data:audio/wav;base64,{base64_audio}"


async def generate_voice(text: str, emotion: str, voice_name: str) -> str:
    """Generate Thai speech audio using Microsoft Edge TTS."""
    rate = "+0%"
    if emotion == "angry":
        rate = "+15%"  
    elif emotion == "sad":
        rate = "-12%"  
        
    communicate = edge_tts.Communicate(text, voice_name, rate=rate)
    audio_data = b""
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data += chunk["data"]
            
    if not audio_data:
        raise ValueError("Failed to generate audio from Edge TTS.")
        
    base64_audio = base64.b64encode(audio_data).decode("utf-8")
    return f"data:audio/mp3;base64,{base64_audio}"


async def start_tts_worker():
    """Background worker loop to process the donation queue."""
    while True:
        donation = await donation_queue.get()

        if obs_manager.active_connections:
            try:
                if system_settings.tts_engine == "edge-tts":
                    user_voice = donation.get("voice", "th-TH-PremwadeeNeural")
                    audio_data = await generate_voice(
                        donation["text"], donation["emotion"], user_voice
                    )
                elif system_settings.tts_engine == "gemini-tts":
                    audio_data = await generate_gemini_voice(
                        donation["text"], donation["emotion"]
                    )
                else:
                    await asyncio.sleep(0.5)
                    audio_data = "MOCK_AUDIO_DATA"

                obs_manager.audio_done_event.clear()

                await obs_manager.broadcast_alert(
                    {
                        "action": "PLAY_AUDIO",
                        "name": donation["name"],
                        "text": donation["text"],
                        "audio": audio_data,
                        "amount": donation.get("amount", 20),
                        "emotion": donation.get("emotion", "normal"),
                    }
                )

                try:
                    await asyncio.wait_for(obs_manager.audio_done_event.wait(), timeout=15.0)
                except asyncio.TimeoutError:
                    pass

            except Exception:
                pass
        else:
            pass

        donation_queue.task_done()
