#!/usr/bin/env python3
from aiohttp import web
import whisper
import logging
import subprocess
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL = None
MODEL_NAME = "base"

async def cors_middleware(app, handler):
    async def middleware_handler(request):
        response = await handler(request)
        if request.method == 'OPTIONS':
            return web.Response(status=200, headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            })
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    return middleware_handler

def transcribe_audio(audio_data):
    try:
        webm_path = '/tmp/audio.webm'
        wav_path = '/tmp/audio.wav'
        
        with open(webm_path, 'wb') as f:
            f.write(audio_data)
        
        subprocess.run([
            'ffmpeg', '-y', '-i', webm_path,
            '-ar', '16000', '-ac', '1', '-acodec', 'pcm_s16le', wav_path
        ], capture_output=True)
        
        result = MODEL.transcribe(wav_path, language='zh', fp16=False)
        
        os.remove(webm_path)
        os.remove(wav_path)
        
        return result["text"].strip()
    except Exception as e:
        logger.error(f"转写错误: {e}")
        return ""

async def handle_upload(request):
    reader = await request.multipart()
    field = await reader.next()
    if field.name == 'file':
        audio_data = await field.read()
        logger.info(f"收到音频: {len(audio_data)} bytes")
        text = transcribe_audio(audio_data)
        logger.info(f"转写结果: {text}")
        return web.json_response({"text": text, "success": True})
    return web.json_response({"error": "No file provided"}, status=400)

async def handle_health(request):
    return web.json_response({"status": "ok", "model": MODEL_NAME})

app = web.Application(middlewares=[cors_middleware])
app.router.add_post('/inference', handle_upload)
app.router.add_get('/health', handle_health)

if __name__ == "__main__":
    logger.info(f"加载 Whisper {MODEL_NAME} 模型...")
    MODEL = whisper.load_model(MODEL_NAME)
    logger.info("模型加载完成!")
    web.run_app(app, host="0.0.0.0", port=8080)
