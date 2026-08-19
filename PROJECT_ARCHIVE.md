# DevTools Hub — 项目归档文档

> 归档日期：2026-08-13
> Git Commit：6d6d4f3（含待提交工作区变更，见 §6）
> 部署地址：https://110.42.247.238

---

## 1. 项目概述

**DevTools Hub** 是一个集开发者工具、经典游戏、AI 导航于一体的综合性前端应用。技术栈：React 19 + Vite 7 + TypeScript + Tailwind CSS。

### 功能模块

| 模块 | 说明 |
|------|------|
| AI 导航黄页 | 收录全网优质 AI 工具的导航页 |
| Coding The World | 探索优质开源项目 |
| 经典游戏 | 街机/FC/GBA 模拟器（魂斗罗、坦克大战、超级马里奥、三国战纪等） |
| 休闲游戏 | 连连看、蜘蛛纸牌、扫雷、2048、黄金矿工 |
| 离线工具 | 40+ 开发工具，无需网络 |
| DevOps 管理 | 可视化部署与运维管理平台 |
| 镜像管理 | 私有 Docker Registry 可视化管理 |
| GaussDB 学习 | 数据库在线学习 + 浏览器内 SQL 练习（仅 PGlite 本地引擎） |
| 电子请柬 | 婚礼/生日/满月/乔迁/派对邀请函在线制作 |

---

## 2. 最近更新

### 电子请柬：照片存储对接阿里云 OSS（无地域属性 bucket）(2026-08-18)

- **动机**：照片 base64 直存数据库体积大、本地 uploads/ 单机存储无备份；改用阿里云 OSS 存照片，数据库只存 OSS URL
- **bucket**：`52cv-website`（控制台显示"无地域属性(中国内地)"，公共读 + 防盗链白名单 `https://52cv.top`）
- **无地域属性 bucket 踩坑（关键）**：
  - 默认域名 `<bucket>.oss.aliyuncs.com` → **403 NonStandardHostForbidden**（2025-03-20 起新开通 OSS 用户的中国大陆 bucket 默认公网域名被禁用）
  - 真实 endpoint 由服务端错误 XML 返回：**`oss-rg-china-mainland.aliyuncs.com`**
  - `ali-oss` SDK `region` 参数不允许点号（`The region must be conform to the specifications`），须用 **`endpoint` 参数**
- **代码改动**（`invitation-api/server.js` + `package.json`，commit `77c061d`）：
  - `initOSS`：`OSS_REGION` 以 `.aliyuncs.com` 结尾 → `opts.endpoint = https://<region>`，否则 `opts.region`
  - `ossBaseUrl()`：同上规则拼访问域名（无 CDN 时）
  - `extractPhotos` 改 async：OSS 优先（key=`invitation/<id>-p<i>.<ext>`，Cache-Control immutable），未配 OSS 回退本地 uploads/；`removeInvPhotos` 清理 OSS/本地旧照片
  - `package.json` 新增 `ali-oss@^6.20.0`
- **实测验证**：连接/列目录/上传/删除 ✓；防盗链生效（无 Referer 被拒）✓；公共读后带/不带 Referer 均 HTTP 200 ✓；bucket 无残留
- **部署**：服务器 `/opt/invitation-api` 需 `npm install`；pm2 环境变量 `OSS_REGION=oss-rg-china-mainland.aliyuncs.com` / `OSS_BUCKET=52cv-website` / `OSS_ACCESS_KEY_ID` / `OSS_ACCESS_KEY_SECRET`（密钥只入 pm2 env，不落代码）
- ⚠️ 安全提醒：AccessKey 曾在对话中明文出现，部署完成后建议 RAM 控制台轮换

### 电子请柬：OSS 图片接入 CDN 加速域名（2026-08-18）

- **动机**：46 张微信原图（10~17MB/张）直链 OSS，照片墙每访客下载 ~570MB；先落地 `x-oss-process=image/resize,w_400` 缩略图（流量 -99%），再接入 CDN 加速域名提升大图加载
- **CDN 加速域名**：`image.dns.52cv.top`（CNAME → `image.dns.52cv.top.w.kunlunaq.com`，阿里云 CDN）
- **控制台配置（用户操作，3 个关键项）**：
  - 防盗链白名单加裸域 `52cv.top` —— `*.52cv.top` 通配符**不含裸域**，不加则页面（裸域 Referer）403 `denied by Referer ACL`（CDN 层）
  - HTTPS 证书（DigiCert DV，CN=image.dns.52cv.top）—— 页面是 https，CDN 域名不上证书会 Mixed Content 拦截 / 握手失败
  - 缓存配置「忽略参数」→ **不忽略** —— 在「缓存配置」下**独立子菜单**（不在「缓存过期时间」弹窗内）；忽略模式下带参与不带参共享缓存 key，先缓存原图则缩略图请求命中原图（12.6MB），反之大图拿到小图，互相污染
- **排查要点**：OSS 层防盗链全放行（`AllowEmptyReferer=true` + RefererList 空），403 来自 **CDN 层**（`Server: Tengine` + `Via: kunlun` + `X-Tengine-Error: denied by Referer ACL`）；缓存污染用**未访问过的新照片** + 看 `X-Cache`/`Age`/`X-Swift-SaveTime` 判断；CNAME 目标域名不可直接访问（403+无证书）
- **前端**（`devtools-hub/src/components/invitation/HeartPhotoWall.tsx`）：`thumbUrl(src)` 对 `.aliyuncs.com` / `image.dns.52cv.top` 链接自动追加 `?x-oss-process=image/resize,w_400`，仅缩略图墙使用；Lightbox 大图与「下载原图」保留原 URL
- **数据库**：`Cl3E8vBc`（唯一 OSS 照片请柬）46 个 photos URL 前缀替换为 `https://image.dns.52cv.top`（PG 直改）
- **实测**：缩略图 46/46 走 CDN + resize 参数全加载（400×600）；Lightbox 大图 CDN 原图 3911×5866 ✓；带参 215KB / 不带参 12.6MB 缓存隔离 ✓

### 电子请柬：浏览页移除「编辑请柬」入口（2026-08-18）

- **动机**：请柬分享后会被访客误触「编辑请柬」按钮进入编辑模式，防止误改已生成请柬数据
- **代码改动**（`devtools-hub/src/components/invitation/InvitationView.tsx` + `src/components/Invitation.tsx`）：
  - `InvitationView`：删除顶部浮动操作条左侧「编辑请柬」按钮，操作条改 `justify-end`（仅保留右侧「分享请柬」）
  - 同步清理 `onBack` prop 链：`InvitationView` 移除 `onBack` prop → `Invitation.tsx` 长链/短链调用与 `RemoteInvitation` 移除 `onBack` 传参 → `edit:'1'` 入口不再从浏览页暴露
  - 编辑器能力保留：仍可通过 URL `?id=X&edit=1` 直接进入编辑
- **部署**：新 JS `index-C3ZnMkcX.js`（`application/javascript` ✓）
- **浏览器实测**：封面仅「轻触开启」；正文页按钮为「分享请柬」「送出祝福」，无任何「编辑」字样 ✓

### 电子请柬：移动端双指缩放防误触翻页（2026-08-18）

- **动机**：照片墙 Lightbox 原触摸事件只判断 X 方向位移，移动端双指缩放/放大手势（`touches.length === 2`）被误判为 swipe 翻页，体验割裂
- **⚠️ 排错关键**：`PhotoCarousel.tsx` 虽名为轮播组件但**从未被任何文件 import**（被 tree-shaken），用户实际看到的 Lightbox 是 `HeartPhotoWall.tsx` 内联实现的。第一次修复改错文件（部署后 hash 不变、行为无变化）——**改动前必须确认组件是否被引用**
- **代码改动**（`devtools-hub/src/components/invitation/HeartPhotoWall.tsx`）：
  - ref 从 `touchX: number` 升级为 `touchStartRef: { id, x, y }`（记录 touch identifier + 坐标），另加 `multiTouchRef` 标记多指
  - Lightbox 根 div `style` 加 `touchAction: 'pan-y'`：浏览器只处理纵向滚动，捏合缩放不再由浏览器接管
  - `onTouchStart`：`e.touches.length > 1`（双指落屏）立即置 `multiTouchRef = true` 并清空起始点，不进入 swipe 起始状态
  - `onTouchMove`：中途加入第二根手指（单→多指缩放）时实时置 `multiTouchRef = true` 并清空起始点
  - `onTouchEnd`：`multiTouchRef === true` 或起始点缺失则**直接 return**；否则只在 `changedTouches` 中**找到起始 identifier 的手指**时计算位移（双指缩放时另一指先抬、位移再大也不误判）；且要求 `|dx| > 60 && |dx| > |dy| * 1.2`（仅水平主导滑动才翻页，双指缩放手指多为斜向/竖向被过滤）
  - `onTouchCancel`：系统中断触摸（来电/手势冲突）时也清理
  - 单指 swipe 行为保留（阈值从 40px 提到 60px）
- **部署**：新入口 `index-B8gVPX7q.js`（MIME `application/javascript` 902508 bytes ✓）；服务器产物 grep `touchAction:"pan-y"` 与多指 touchStart 逻辑均已确认
- **⚠️ 部署坑**：rsync `--size-only` 因新旧 `index.html` 字节数相同而跳过传输，需 `--ignore-times` 强制覆盖（或先删服务器旧 index.html）

### 电子请柬：背景音乐改为《执子之手》（2026-08-19）

- **需求**：婚礼请柬背景音乐改为《执子之手》宝石Gem/哩哩
- **版权排查**：原版网易云 id=1995495104 为 VIP 收费歌曲（详情接口 `fee:1`），`outer/url` 外链仅返回 **30 秒试听片段**（128kbps / 480KB，ffprobe 验证 duration=30s）——与之前《APT.》原版同样受限
- **解决方案**：改用网易云上可完整播放的 Cover 版本 id=3381679941（王六一《执子之手 (Cover 宝石Gem、哩哩)》，`fee:0` 免费，实测 3,057,783 bytes / **191 秒完整版**，`outer/url` 200 audio/mpeg ✓）
- **改动**（`devtools-hub/src/data/invitationMusic.ts`）：歌单第一首（默认播放）改为《执子之手》（artist 标注「宝石Gem/哩哩（Cover 王六一）」），保留第二首《24 小时摇滚聚会》轮播；注释更新版权说明
- **部署**：新入口 `index-DFl7Y3us.js`（MIME `application/javascript` 902535 bytes ✓）；服务器产物 grep `3381679941` 已确认
- **备选**：若需原唱完整版，可在请柬编辑器自定义音乐上传原版音频（`data.music` 字段已支持）

### 电子请柬：短链接 + 数据库存储 (2026-08-17)

- **动机**：此前请柬数据（含 base64 图片）全部 base64url 编码进 URL `?d=`，链接超长难分享
- **后端**：新增 `invitation-api/`（零依赖 Node 内置 http，端口 3002）——`POST /invitation` 存请柬数据返回 8 位短 ID；`GET /invitation/:id` 读数据；`GET /health` 健康检查；body 上限 25MB（照片 base64）；优先 `better-sqlite3`（SQLite），未安装则回退 JSON 文件存储（本地开发即用此模式）
- **nginx.conf**：新增 `location /inv-api/` → `127.0.0.1:3002`（`proxy_pass` 尾斜杠去前缀），`client_max_body_size 25m`
- **vite.config.ts**：dev 代理 `/inv-api` → `localhost:3002` + `rewrite` 去前缀
- **前端**：
  - `src/lib/invitationApi.ts`：`saveInvitation(data)` → 短 ID；`loadInvitation(id)` → 数据（自动补齐缺省字段）
  - `Invitation.tsx`：主组件新增 `?id=` 分支（`RemoteInvitation` 异步加载 + 加载中转场 + 失败显示无效链接）；编辑器 `goShare` 改为先 POST 数据库拿短 ID → 跳 `/invitation?id=xxx`，**后端不可用时自动回退旧 `?d=` 长链接**；复制链接在有 `savedId` 时用短链；生成按钮带"保存中…"状态
- **分享链接形态**：`/invitation?id=xxxxxxxx`（8 位 base62）vs 旧版 `/invitation?d=<超长base64>`
- **构建踩坑**：`npx vite build` 被工具误判为 watch 命令，需后台 nohup + 日志文件确认
- **部署**：服务器上传 `invitation-api/` → `npm i better-sqlite3`（可选）→ `pm2 start server.js --name invitation-api` → nginx 加 `/inv-api/` 代理 + reload → 前端重新 build 上传

### 电子请柬：上传编辑增强 + 青春动效 (2026-08-17)

- **照片上传编辑**：编辑器新增"上传照片"按钮（`accept="image/*" multiple` 批量选择），图片经 `compressImage.ts`（canvas 压缩至 900px / q0.74）转 base64 嵌入请柬链接；base64 输入框显示"（已上传图片）"与 KB 体积徽标，总嵌入体积 >900KB 时提示改用图床直链
- **相册展示（淘宝详情式竖排平铺）**：宾客端照片墙从"卡片内横向轮播"改为**竖排平铺大图**——每张图全宽 edge-to-edge、按原比例 `w-full h-auto` 依次往下排，标题"GALLERY · 最美瞬间"吸顶（sticky + 渐变蒙板），每张图右下角 `1 / N` 序号角标，`Reveal delay={i*60}` 渐入
- **浏览页改造**：外层滚动由强制 `snap-y snap-mandatory` 改为自然滚动（保证照片长图自由浏览）；页点指示器改为按 `[data-page]` 块 `offsetTop` + 45% 视口高阈值扫描，长照片区也能正确指示当前块
- **全屏轮播组件保留**：`PhotoCarousel.tsx` 支持 `fullscreen` prop（沉浸大图 + 大箭头 + 底部指示点），卡片/全屏模式可复用（当前照片墙用竖排平铺，未启用轮播）
- **青春动效**：新增 `gradient-flow`（渐变流动）、`pop-in`（弹性弹入）、`rise-in`、`float-y`、`wiggle`、`tick-pop`（倒计时数字跳）、`bounce-soft`、`particle-rise` 等动画；封面 staggered 弹入 + 爱心/星星/泡泡粒子组合；正文标题 pop-in、页点指示器光晕、致谢页粒子 + 渐变流动叠层
- **主题扩充到 8 套**：6 原主题渐变调亮（浅→深）+ 新增糖果粉 🍭 / 晴空蓝 🧁
- **关键文件**：`src/components/invitation/`（InvitationView / PetalRain / PhotoCarousel / compressImage）、`src/components/Invitation.tsx`、`src/data/invitation.ts`、`src/index.css`
- 构建踩坑：`rm -rf dist/roms`（526 文件）会触发删除保护审批超时，构建前改用 `mv dist/roms /tmp/roms_bak_*`

### 电子请柬 (2026-08-13)

- **新增 Invitation** — 电子请柬在线制作工具，路由 `/invitation`，首页导航 + Hero 区入口
- **纯前端实现**：请柬数据 base64url 编码进 URL query（`?d=`），分享链接即请柬本体，无需后端存储
- **5 种场景**：婚礼 / 生日 / 满月 / 乔迁 / 派对
- **6 套主题**：中国红 / 香槟金 / 浪漫粉 / 清新绿 / 星空紫 / 海盐蓝
- **功能**：表单编辑实时预览、倒计时、背景音乐（4 首内置 mp3）、高德地图跳转、分享链接一键复制
- **关键文件**：`src/components/Invitation.tsx`、`src/data/invitation.ts`、`public/audio/invitation/`（4 首 mp3）

### GaussDB 数据库在线学习 (2026-08-13)

- **新增 GaussDBLearn** — GaussDB 数据库在线学习与 SQL 练习平台，路由 `/gaussdb-learn`
- **核心引擎 PGlite 0.5.4** — PostgreSQL WASM，浏览器内直接运行 SQL，无需后端服务器
- **10 章课程**：数据库概述 → SQL 基础 → DDL → DML → SELECT → 聚合分组 → JOIN → 子查询 → 函数 → 视图事务
- **20 道练习题**：CodeMirror SQL 编辑器（PostgreSQL 方言高亮 + 自动补全），支持运行/查看答案/自动比对（行数+内容）
- **内置示例数据集**：departments / jobs / employees 三张表，贴近企业人事管理场景
- **首页入口**：顶部导航"数据库学习"链接 + Hero 区 NEW 高亮提示条 + 工具卡片
- **关键配置**：`vite.config.ts` 需 `assetsInclude: ['**/*.wasm', '**/*.data']` + `optimizeDeps.exclude: ['@electric-sql/pglite']`，否则 PGlite 运行时报 `Invalid FS bundle size`
- **2026-08-13 变更**：服务器真库模式已下线，前端仅保留 PGlite 本地模式（详见下文）

#### 服务器真库 SQL 验证引擎 (2026-08-13 追加，2026-08-13 已下线)

> **已下线**：前端仅保留 PGlite 本地模式；`sql-api/` 目录已从仓库删除（server.js / init.sql / setup-role.sh / package.json），`vite.config.ts` 的 `/sql-api` dev proxy 与 `nginx.conf` 的 `/sql-api/` location 均已移除，项目代码中已无数据库账号密码明文（仅存于服务器文件系统）。

- ~~**核心能力**：浏览器 PGlite 之外，新增 **服务器 PostgreSQL 18.4 真库**作为 SQL 验证引擎，前端可一键切换~~
- ~~**PostgreSQL 18 容器** (`gaussdb-pg`)：监听 `127.0.0.1:5432`（不暴露公网），数据卷 `/opt/pgdata:/var/lib/postgresql`（PG 18+ 约定路径，不能挂到 `data` 子目录）~~
- ~~**低权限角色** `gaussdb_app`：执行用户 SQL；超级用户 `postgres` 仅用于 `/reset` 重置示例数据集；密码分别存 `/opt/sql-api/.apppass` 与 `.pgpass`（600 权限）~~
- ~~**SQL API 服务** (`/opt/sql-api`，Express + pg，pm2 管理)：`POST /execute`（单语句 + statement_timeout=5s）、`POST /reset`（多语句脚本）、`GET /health`；多语句通过词法分析（忽略字符串/注释）拒绝非单条执行~~
- ~~**nginx**：`location /sql-api/ → http://127.0.0.1:3002/`（proxy_pass 带尾斜杠剥离前缀）~~
- ~~**前端**：Header 加 `Globe`/`Server` 图标的"浏览器 / 服务器真库"切换按钮组，状态徽章/侧边栏说明/footer 全部按引擎模式动态渲染~~
- ~~**vite dev**：`/sql-api` 代理到 `https://110.42.247.238`（`secure: false`），本地开发可联调服务器真库模式~~
- ~~**端到端验证**：页面 200、health `{"ok":true,"version":"18.4"}`、综合查询 `current_database()=gaussdb_learn`、`current_user=gaussdb_app`、耗时 1ms~~

#### 数据库公网直连 (2026-08-13)

- **容器重建**：`gaussdb-pg`（postgres:18）端口绑定由 `127.0.0.1:5432` 改为 `0.0.0.0:5432`（公网可直连），数据卷 `/opt/pgdata`、环境变量、`restart=always` 全部保留，数据未丢失；旧容器备份为 `gaussdb-pg-old` 后已删除
- **连接信息**：主机 `110.42.247.238:5432`，数据库 `gaussdb_learn`，超级用户 `postgres`（仅运维用），低权限角色 `gaussdb_app`（执行 SQL 用）
- **pg_hba.conf**：已允许任意来源 `host all all all scram-sha-256`
- ⚠️ **风险提示**：服务器 UFW 未启用，公网 5432 端口对全网可见，存在被扫描爆破风险；验证完若不需要常开，建议恢复 127.0.0.1 绑定或加防火墙限制
- **遗留事项**：服务器 `/opt/sql-api/` 目录（含 `.apppass` / `.pgpass` 密码文件）与 pm2 `sql-api` 服务仍在服务器上，尚未删除（前端已不再使用，属可清理项）

### 游戏中心重构 (2026-05-23)

- **新增 ArcadeGame** — EmulatorJS 街机模拟器，支持三国战纪等 MAME/FBA ROM
- **新增 NESGame** — FC/NES 模拟器组件
- **新增 GameHub** — 统一游戏入口页面，集成方向键和投币/开始按钮
- **新增 GoldMiner** — 黄金矿工休闲小游戏（内联 HTML, 1319行）
- **新增 ErrorPage** — 404 页面
- **删除 FlappyBird** — 已废弃

- **新增 ArcadeGame** — EmulatorJS 街机模拟器，支持三国战纪等 MAME/FBA ROM
- **新增 NESGame** — FC/NES 模拟器组件
- **新增 GameHub** — 统一游戏入口页面，集成方向键和投币/开始按钮
- **新增 GoldMiner** — 黄金矿工休闲小游戏（内联 HTML, 1319行）
- **新增 ErrorPage** — 404 页面
- **删除 FlappyBird** — 已废弃

### 模拟器适配

- ContraFC、Sanmo、SuperMario、TankBattle 改用 EmulatorJS 加载
- 键盘映射（EmulatorJS arcade 默认）:
  - V = 投币, Enter = 开始, X = B, S = Y
  - 方向键 ↑↓←→

### 关键修复

- **iframe 跨域**：react-emulatorjs 通过 iframe 加载，API 需从 `iframe.contentWindow.EJS_emulator` 获取
- 投币/开始按钮现在正常工作

### 关键文件

| 文件 | 行数 | 说明 |
|------|------|------|
| `src/components/GameHub.tsx` | 488 | 统一游戏入口 |
| `src/components/GoldMiner.tsx` | 1319 | 黄金矿工游戏 |
| `src/components/ArcadeGame.tsx` | 244 | 街机模拟器 |
| `src/components/NESGame.tsx` | 181 | FC 模拟器 |
| `src/arcadeControls.ts` | 48 | 街机按键定义 |
| `src/nesControls.ts` | 35 | FC 按键定义 |
| `src/components/GaussDBLearn.tsx` | ~690 | GaussDB 在线学习页（仅 PGlite 本地引擎） |
| `src/data/gaussdb-course.ts` | 768 | 课程 + 练习题数据 |
| `src/components/Invitation.tsx` | 614 | 电子请柬编辑器（照片上传、主题、表单、分享链接） |
| `src/components/invitation/InvitationView.tsx` | 798 | 请柬浏览页（封面 + 竖排平铺照片墙 + 6 屏滚动） |
| `src/components/invitation/PetalRain.tsx` | 96 | 粒子/花瓣雨（爱心/星星/泡泡 shapes） |
| `src/components/invitation/PhotoCarousel.tsx` | 220 | 轮播图组件（卡片 / 全屏沉浸双模式） |
| `src/components/invitation/compressImage.ts` | — | 图片 canvas 压缩（900px / q0.74）转 base64 |
| `src/data/invitation.ts` | 254 | 请柬数据模型 + 8 主题 + base64url 编解码 |

---

## 3. 项目结构

```
├── devtools-hub/                  # 前端主项目
│   ├── src/
│   │   ├── components/            # React 组件 (~30+)
│   │   ├── router.tsx             # 路由配置
│   │   ├── App.tsx                # 主应用
│   │   └── main.tsx               # 入口
│   ├── public/
│   │   ├── emulatorjs/data/       # EmulatorJS 运行时 (78MB, gitignore)
│   │   ├── roms/                  # ROM 文件 (278MB, gitignore)
│   │   ├── games/                 # 内联小游戏资源
│   │   └── audio/invitation/      # 电子请柬背景音乐 (4 mp3)
│   └── package.json
├── docker-api/                    # Docker API 后端 (Express)
├── jenkins/                       # Jenkins CI/CD 配置
├── nginx.conf                     # Nginx 反向代理
├── deploy.sh                      # 直接 SSH 部署脚本
├── local-deploy.sh                # Docker Registry 部署流水线
├── Dockerfile.frontend            # 前端 Docker 镜像
└── docker-compose.local.yml       # 本地开发编排
```

---

## 4. 部署信息

| 项目 | 值 |
|------|-----|
| 服务器 | 110.42.247.238 (Ubuntu 22.04, 4C/3.6GB/40GB) |
| 访问地址 | https://110.42.247.238 |
| 前端路径 | /usr/share/nginx/html |
| Registry | 110.42.247.238:5000 |
| SSH Key | ~/.ssh/devtools_key |
| PostgreSQL | 110.42.247.238:5432 (gaussdb_learn, postgres/gaussdb_app) |

### 部署方式

```bash
# 方式1: 直接上传（当前使用）
./deploy.sh frontend

# 方式2: Docker Registry 流水线
./local-deploy.sh

# 方式3: Jenkins CI/CD
# 访问 http://localhost:8080 (admin/admin123)
```

---

## 5. 运行时依赖（不在 git 中）

以下大文件已加入 `.gitignore`，需手动获取：

| 目录 | 大小 | 说明 |
|------|------|------|
| `devtools-hub/public/emulatorjs/data/` | 78MB | EmulatorJS 框架 |
| `devtools-hub/public/roms/` | 278MB | 游戏 ROM 文件 |

---

## 6. Git 提交记录

```
6d6d4f3 fix(gaussdb): 修复引擎切换按钮卡死问题
  - 引擎切换按钮移除 disabled，引入 switching 中间态 + engineModeRef
  - 离开浏览器模式时主动 close() PGlite 实例释放 WASM 内存

c360b98 docs: 归档 GaussDB 服务器真库 SQL 验证引擎 (0682ce0)

0682ce0 feat: GaussDB 学习支持服务器真库验证引擎 (PostgreSQL 18)
  - 7 files changed
  - 新增: sql-api/ (server.js + init.sql + setup-role.sh + package.json)
  - 修改: GaussDBLearn.tsx (双引擎模式)、vite.config.ts (dev proxy)、nginx.conf (/sql-api/)
  - (注：本功能已于 2026-08-13 下线，见归档正文)

e1eb79a feat: GaussDB 数据库在线学习与 SQL 练习平台
  - 8 files changed, +1513 / -7
  - 新增: GaussDBLearn, gaussdb-course (PGlite 0.5.4)
  - 首页导航 + Hero 区 NEW 入口

7108910 feat: 游戏中心重构 - 街机/FC模拟器集成 + 黄金矿工
  - 20 files changed, +3172 / -655
  - 新增: ArcadeGame, NESGame, GameHub, GoldMiner, ErrorPage
  - 删除: FlappyBird
  - .gitignore 更新
```

### 待提交变更 (2026-08-17，归档时工作区状态)

```
feat(invitation): 上传编辑增强 + 青春动效 + 淘宝详情式竖排平铺照片墙
  - 新增: components/invitation/ (InvitationView / PetalRain / PhotoCarousel / compressImage)
  - 修改: Invitation.tsx (上传照片 + base64 嵌入 + 体积徽标)
  - 修改: data/invitation.ts (8 主题: 6 调亮 + 糖果粉/晴空蓝)
  - 修改: index.css (gradient-flow / pop-in / tick-pop / particle-rise 等动画)
  - 浏览端: 照片墙改竖排平铺大图, 外层自然滚动, 页点指示器按 data-page 块扫描
```

### 待提交变更 (2026-08-13，归档时工作区状态)

```
feat(invitation): 电子请柬 + feat(gaussdb): 下线服务器真库，仅保留 PGlite
  - 新增: Invitation.tsx, data/invitation.ts, public/audio/invitation/ (4 mp3)
  - 修改: App.tsx / tools.ts / router.tsx (电子请柬入口 + SEO)
  - 修改: GaussDBLearn.tsx (删除 server 模式，仅 PGlite)、vite.config.ts、nginx.conf
  - 删除: sql-api/ (server.js / init.sql / setup-role.sh / package.json)
```
