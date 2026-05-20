#!/usr/bin/env python3
from aiohttp import web
import whisper
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL = None

async def cors_middleware(app, handler):
    async def middleware_handler(request):
        response = await handler(request)
        if request.method == 'OPTIONS':
            return web.Response(status=200, headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400',
            })
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    return middleware_handler

async def transcribe_audio(audio_data):
    try:
        with open('/tmp/audio.webm', 'wb') as f:
            f.write(audio_data)
        result = MODEL.transcribe('/tmp/audio.webm', language='zh', fp16=False)
        return result["text"].strip()
    except Exception as e:
        logger.error(f"转写错误: {e}")
        return ""

async def handle_upload(request):
    reader = await request.multipart()
    field = await reader.next()
    if field.name == 'file':
        audio_data = await field.read()
        text = await transcribe_audio(audio_data)
        return web.json_response({"text": text, "success": True})
    return web.json_response({"error": "No file provided"}, status=400)

async def handle_health(request):
    return web.json_response({"status": "ok", "model": "tiny"})

app = web.Application(middlewares=[cors_middleware])
app.router.add_post('/inference', handle_upload)
app.router.add_get('/health', handle_health)

if __name__ == "__main__":
    logger.info("加载 Whisper tiny 模型...")
    MODEL = whisper.load_model("tiny")
    logger.info("模型加载完成!")
    web.run_app(app, host="0.0.0.0", port=8080)
