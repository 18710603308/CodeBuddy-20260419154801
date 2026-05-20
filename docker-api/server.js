const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const execPromise = (cmd) => {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 300000 }, (error, stdout, stderr) => {
      if (error) {
        reject({ error: error.message, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

// 拉取镜像
app.post('/api/docker/pull', async (req, res) => {
  const { image, tag = 'latest' } = req.body;
  try {
    const result = await execPromise(`docker pull ${image}:${tag}`);
    res.json({ success: true, message: `已拉取 ${image}:${tag}` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.error || e.stderr });
  }
});

// 标记镜像
app.post('/api/docker/tag', async (req, res) => {
  const { source, target } = req.body;
  try {
    await execPromise(`docker tag ${source} ${target}`);
    res.json({ success: true, message: `已标记 ${target}` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.error });
  }
});

// 推送镜像
app.post('/api/docker/push', async (req, res) => {
  const { image } = req.body;
  try {
    const result = await execPromise(`docker push ${image}`);
    res.json({ success: true, message: `已推送 ${image}` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.error || e.stderr });
  }
});

// 从私有仓库拉取
app.post('/api/docker/pull-registry', async (req, res) => {
  const { image } = req.body;
  const REGISTRY = '110.42.247.238:5000';
  try {
    await execPromise(`docker pull ${REGISTRY}/${image}`);
    res.json({ success: true, message: `已从私有仓库拉取 ${image}` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.error || e.stderr });
  }
});

// 获取本地镜像列表
app.get('/api/docker-images', async (req, res) => {
  try {
    const result = await execPromise('docker images --format "{{.Repository}}:{{.Tag}}"');
    const images = result.stdout.trim().split('\n').filter(Boolean);
    res.json({ success: true, images });
  } catch (e) {
    res.status(500).json({ success: false, message: e.error });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Docker API 服务运行在端口 ${PORT}`);
});
