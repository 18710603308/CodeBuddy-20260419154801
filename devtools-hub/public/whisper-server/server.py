#!/usr/bin/env python3
"""轻量级 Whisper HTTP 语音识别服务"""
import asyncio
import io
import base64
import numpy as np
from aiohttp import web
import argparse
import subprocess
import sys

# 安装依赖
def install(packages):
    for pkg in packages:
        try:
            __import__(pkg.replace("-", "_").replace("aiohttp", "aiohttp"))
        except:
            subprocess.check_call([sys.executable, "-m", "pip", "install", pkg, "-q"])

install(["aiohttp", "numpy", "soundfile", "openai-whisper"])

import whisper

MODEL = None
MODEL_NAME = None

async def transcribe_audio(audio_data: bytes) -> str:
    """转写音频"""
    try:
        # 保存为临时文件
        with open('/tmp/audio.webm', 'wb') as f:
            f.write(audio_data)
        
        # 使用 whisper 转写
        result = MODEL.transcribe('/tmp/audio.webm', language='zh', fp16=False)
        return result["text"].strip()
    except Exception as e:
        print(f"转写错误: {e}")
        return ""

async def handle_upload(request):
    """处理音频上传"""
    reader = await request.multipart()
    field = await reader.next()
    
    if field.name == 'file':
        audio_data = await field.read()
        text = await transcribe_audio(audio_data)
        return web.json_response({"text": text, "success": True})
    
    return web.json_response({"error": "No file provided"}, status=400)

async def handle_health(request):
    """健康检查"""
    return web.json_response({"status": "ok", "model": MODEL_NAME})

async def handle_models(request):
    """获取可用模型"""
    return web.json_response({
        "models": ["tiny", "base", "small", "medium"],
        "current": MODEL_NAME
    })

async def init_app(port):
    app = web.Application()
    app.router.add_post('/inference', handle_upload)
    app.router.add_get('/health', handle_health)
    app.router.add_get('/models', handle_models)
    return app

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", "-m", default="base", help="模型大小")
    parser.add_argument("--port", "-p", type=int, default=8080, help="端口")
    args = parser.parse_args()
    
    global MODEL, MODEL_NAME
    MODEL_NAME = args.model
    
    print(f"加载 Whisper {args.model} 模型...")
    MODEL = whisper.load_model(args.model)
    print(f"模型加载完成! 模型: {MODEL_NAME}")
    
    print(f"启动 HTTP 服务: http://0.0.0.0:{args.port}")
    app = asyncio.run(init_app(args.port))
    web.run_app(app, host="0.0.0.0", port=args.port)

if __name__ == "__main__":
    main()
