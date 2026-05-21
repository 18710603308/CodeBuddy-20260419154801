const express = require('express');
const { exec, spawn } = require('child_process');
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

// 服务健康状态
app.get('/api/status', async (req, res) => {
  const services = {};
  try {
    // Nginx
    const r = await execPromise('curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "0"');
    services.nginx = { status: (r.stdout.includes('200') || r.stdout.includes('301')) ? 'running' : 'down' };
  } catch { services.nginx = { status: 'unknown' }; }

  try {
    // Whisper
    const w = await execPromise('curl -s http://localhost:8080/health 2>/dev/null');
    if (w.stdout.includes('ok')) {
      const d = JSON.parse(w.stdout);
      services.whisper = { status: 'running', model: d.model };
    } else {
      services.whisper = { status: 'down' };
    }
  } catch { services.whisper = { status: 'down' }; }

  try {
    // Registry
    const reg = await execPromise('curl -s http://localhost:5000/v2/_catalog 2>/dev/null');
    const data = JSON.parse(reg.stdout);
    services.registry = { status: 'running', repos: (data.repositories || []).length };
  } catch { services.registry = { status: 'down' }; }

  try {
    // Docker containers
    const c = await execPromise('docker ps --format "{{.Names}}:{{.Status}}"');
    services.containers = c.stdout.trim().split('\n').filter(Boolean);
  } catch { services.containers = []; }

  res.json({ success: true, services });
});

// 部署触发
app.post('/api/deploy', async (req, res) => {
  const { service } = req.body;
  if (!['frontend', 'docker-api', 'nginx', 'all'].includes(service)) {
    return res.status(400).json({ success: false, message: '无效的服务名' });
  }

  // docker-api 自重启：先响应客户端，再异步执行（避免杀掉自己导致请求丢失）
  if (service === 'docker-api' || service === 'all') {
    res.json({ success: true, message: 'Docker API 正在重启，请稍后刷新查看状态...' });
    // 延迟执行，确保响应已发送
    setTimeout(() => {
      const child = spawn('bash', ['/opt/deploy-server.sh', service], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
    }, 500);
    return;
  }

  try {
    const result = await execPromise(`bash /opt/deploy-server.sh ${service}`);
    res.json({ success: true, message: result.stdout.trim() });
  } catch (e) {
    res.status(500).json({ success: false, message: e.error || e.stderr || '部署失败' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Docker API 服务运行在端口 ${PORT}`);
});
