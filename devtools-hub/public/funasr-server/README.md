# FunASR 实时语音识别服务

## 部署到服务器

### 方式一：Docker 一键部署（推荐）

```bash
# 下载 FunASR RuntimeHTTP
docker pull \
  --registry-token=registry.cn-hangzhou.aliyuncs.com/modelscope-repo/modelscope:funasr2.0 \
  registry.cn-hangzhou.aliyuncs.com/modelscope-repo/modelscope:funasr2.0

# 启动服务（CPU版本）
docker run -p 8080:8080 -p 10095:10095 \
  --name funasr-server \
  -v /data/funasr/models:/workspace/models \
  -d registry.cn-hangzhou.aliyuncs.com/modelscope-repo/modelscope:funasr2.0 \
  /workspace/models/seaco_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-pytorch \
  /workspace/models/speech_fsmn_vad_zh-cn-16k-common-pytorch \
  /workspace/models/speech_paraformer-large_vad_trigger_asr_nat-zh-cn-16k-common-vocab8404-pytorch \
  /workspace/models/speech_timestamp_fsmn_vad_zh-cn-16k-common-pytorch \
  /workspace/models/speech_int8_sequence_inference_model--cn W200 \
  --vad-server unixsocket \
  --vad-unix-socket-file /workspace/vad.sock \
  --asr-server unixsocket \
  --asr-unix-socket-file /workspace/asr.sock \
  --hotword /workspace/hotword.txt
```

### 方式二：Python 部署

```bash
# 安装
pip install -U funasr

# 下载模型
from modelscope.hub import snapshot_download
snapshot_download('damo/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-pytorch', cache_dir='/data/models')

# 启动服务
python -m funasr.apps.asr_http_server \
  --model /data/models/damo/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-pytorch \
  --vad-model damo/speech_fsmn_vad_zh-cn-16k-common-pytorch \
  --port 8080
```

## API 接口

### WebSocket 实时识别（推荐）
```javascript
ws://your-server:10095
```

发送音频格式：
- 采样率：16000Hz
- 编码：PCM (16bit) 或 Opus
- 发送方式：流式发送

### HTTP 批量转写
```
POST http://your-server:8080
Content-Type: multipart/form-data
file: audio.wav
```

## 环境要求
- CPU: 4核以上
- 内存: 8GB以上
- 磁盘: 10GB以上（模型存储）
