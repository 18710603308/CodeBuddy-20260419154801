# Whisper.cpp 服务端部署指南

## 方案说明
使用 Whisper.cpp 作为本地语音识别后端，前端通过 HTTP API 调用。

## 快速部署

### 1. 下载 Whisper.cpp
```bash
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisperper.cpp
```

### 2. 下载模型
```bash
# 中文模型 (推荐 medium 模型，精度较高)
wget https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin

# 或轻量模型 (推荐中文场景使用)
wget https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin
```

### 3. 编译并启动 HTTP 服务
```bash
# 编译
mkdir build && cd build
cmake ..
make -j4

# 启动 HTTP 服务 (端口 8080)
./build/bin/whisper-server -m ./models/ggml-medium.bin -t 8 --port 8080
```

### 4. Docker 部署 (可选)
```dockerfile
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y git cmake libsdl2-dev
RUN git clone https://github.com/ggerganov/whisper.cpp.git
WORKDIR /whisper.cpp
RUN mkdir build && cd build && cmake .. && make -j4

# 下载模型
RUN ./models/download-ggml-model.sh base

EXPOSE 8080
CMD ["./build/bin/whisper-server", "-m", "./models/ggml-base.bin", "-t", "8", "--port", "8080"]
```

## API 调用示例

### 转写音频文件
```bash
curl -X POST http://localhost:8080/inference \
  -F "file=@audio.wav" \
  -F "language=zh"
```

### 返回格式
```json
{
  "text": "识别的文字内容"
}
```
