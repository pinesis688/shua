# BioQuest — 生物竞赛学习平台

面向生物竞赛（联赛）备考的**纯前端**学习平台，集知识卡片、模拟试题、学习分析、错题本、AI 导师、虚拟实验室、分子/基因组可视化、互动游戏、社区讨论于一体。

> **架构**：纯前端 SPA + Supabase（数据/认证）。AI 调用由前端直连用户自配置的 LLM API（DeepSeek / 智谱 / 通义 / Kimi / NVIDIA / 硅基流动），无需后端运行时。`server.py` 仅作为开发期可选代理，生产部署不依赖。

## 许可证

本项目采用 [CC BY-NC-SA 4.0](./LICENSE)（署名-非商业性使用-相同方式共享 4.0 国际许可证）。

### 作者附加声明：关于「非商业性使用」的明确定义

CC BY-NC-SA 4.0 中「非商业性」（NonCommercial）的法律定义较为模糊，为**扩大本项目的教育影响力、降低使用门槛**，作者在此对「非商业性使用」作出如下**宽松解释**：

#### ✅ 明确允许的使用场景（以下均视为「非商业性」）

| 场景 | 说明 |
|------|------|
| **个人学习** | 学生、自学者自由使用、部署、修改 |
| **学校教学** | 中学、大学、培训机构在课堂教学中使用，无论课程是否收费 |
| **教师/家教使用** | 教师、家教将其作为教学工具用于辅导学生（包括收取学费的情况） |
| **公益/非营利教育** | 公益组织、教育扶贫项目、非营利机构免费或低成本部署使用 |
| **学术研究** | 教育技术研究、学习科学研究中使用、引用、二次开发 |
| **自托管部署** | 任何个人或组织自行搭建、供内部使用（非对外售卖） |
| **衍生贡献** | 基于本项目开发新功能、修复 Bug、改进体验，并回馈到上游社区 |

> **核心原则**：只要你不是在**卖这个软件本身**，而是把它作为工具用于**教育目的**，无论是学校、培训机构还是独立教师，都可以放心使用。教育者靠自己的教学服务收费是正当的，本项目不对此设限。

#### ❌ 明确禁止的使用场景（构成「商业性使用」，需获得作者书面授权）

1. **将本项目（或修改后的版本）作为付费产品/SaaS 服务售卖**（如将 BioQuest 包装成付费学习平台按月收费）
2. **在未开源衍生代码的情况下，将本项目整合进商业教育产品中牟利**
3. **移除版权信息、声称原创并进行商业化分发**
4. **大规模商业部署**（如服务于付费用户规模超过 1000 人的商业教育平台，未与作者沟通）

#### 📜 其他条款

- **署名（BY）**：使用时需保留原作者署名及项目来源链接
- **相同方式共享（SA）**：对本项目的修改、衍生作品，必须以相同的 CC BY-NC-SA 4.0 协议开源发布
- **商业授权**：如你有商业使用需求（如企业内部培训、商业平台集成），欢迎联系作者获取单独授权——教育相关的商业授权通常会免费或极低成本授予

> **协议合规说明**：本项目集成的第三方库均挑选了与 CC BY-NC-SA 4.0 兼容的宽松协议（MIT / Apache-2.0 / BSD-2 / BSD-3 / MPL-2.0），所有库均以本地副本形式打包在 `js/vendor/`，不依赖运行时 CDN（除 Supabase SDK 回退）。完整许可证声明见 [`js/vendor/THIRD_PARTY_LICENSES.txt`](./js/vendor/THIRD_PARTY_LICENSES.txt)。

---

## 快速开始

```bash
# 纯静态部署，无需构建步骤
# 本地预览（任选其一）
npx serve .                  # Node.js
python -m http.server 8000   # Python
```

访问 `http://localhost:8000` 即可。

### 1. Supabase 配置（必需）

1. 在 [supabase.com](https://supabase.com) 创建项目
2. 在 SQL Editor 中按顺序执行：
   - `sql/schema_safe.sql` — 创建所有表 + RLS 策略
   - `sql/incremental_update.sql` — 增量更新（user_key 列、新策略）
3. 在 `js/supabase-client.js` 顶部填入你的 Supabase URL 和 anon key（anon key 设计为公开，靠 RLS 保护数据）

### 2. AI API Key（用户自带，可选）

用户在「我的 → 设置」中配置个人 API Key，支持 6 家服务商：

| 服务商 | 免费额度 | 推荐模型 |
|---|---|---|
| DeepSeek | 500 万 tokens | `deepseek-chat` |
| 智谱 GLM | 2000 万 tokens | `glm-4-flash` |
| 阿里通义 | 100 万 tokens | `qwen-turbo` |
| 月之暗面 Kimi | 15 元体验金 | `moonshot-v1-8k` |
| NVIDIA NIM | 1000 次调用 | `meta/llama-3.3-70b-instruct` |
| 硅基流动 | 14 元额度 | `Qwen/Qwen2.5-7B-Instruct` |

API Key 仅保存在用户本机 localStorage，不上传服务器。每用户每日限 100 次调用，0:00 重置。

### 3. 可选：开发期 AI 代理

```bash
cp .env.example .env   # 填入 NVIDIA_API_KEY
python server.py       # 为未配置个人 Key 的用户提供默认代理
```

---

## 部署

纯静态托管，推荐：

| 平台 | 方式 |
|------|------|
| GitHub Pages | 推送仓库，开启 Pages 即可 |
| Vercel | `vercel --prod`，框架选 Other |
| Netlify | 拖拽上传或连接 Git |
| Cloudflare Pages | 连接 Git 仓库 |

无需环境变量配置（Supabase anon key 内置于前端，受 RLS 保护；AI Key 由用户自配）。

---

## 项目结构

```
bioquest/
├── index.html              # SPA 入口（hash 路由）
├── LICENSE                 # CC BY-NC-SA 4.0
├── server.py               # 可选：开发期 AI 代理
├── manifest.json / sw.js   # PWA 配置与服务工作线程（离线缓存）
├── css/                    # 样式（Trae 设计系统：Modern Botanical Laboratory）
│   ├── globals.css         # 设计 Token（颜色/字体/间距）
│   ├── home.css            # 主页 Hero 与模块卡片
│   └── ...
├── js/                     # 业务模块
│   ├── app.js              # SPA 路由与模块加载器
│   ├── supabase-client.js  # Supabase 客户端（认证/数据/存储）
│   ├── ai-client.js        # 6 家 LLM 统一封装 + 视觉 OCR
│   ├── fsrs-algorithm.js   # FSRS 间隔重复算法（基于 ts-fsrs 包装层）
│   ├── irt-engine.js       # IRT 项目反应理论（能力估计）
│   ├── cards.js            # 知识卡片（Anki 风格）
│   ├── quiz.js / exam.js   # 模拟试题 / 联考
│   ├── wrongbook.js        # 错题本 + OCR
│   ├── photo-quiz.js       # 拍照录题 + OCR 出题
│   ├── tutor.js            # AI 导师（流式渲染）
│   ├── classroom.js        # AI 生物学课堂（含播放器）
│   ├── classmate.js        # 苏格拉底 AI 同学
│   ├── learning-dna.js     # 学习 DNA + 情绪 DNA
│   ├── mood-tracker.js     # 身心健康融合
│   ├── bio-lab.js          # 虚拟实验室
│   ├── bio-animation.js    # 生物过程动画
│   ├── phet-sims.js        # PhET 互动模拟实验（CC BY 4.0 iframe）
│   ├── knowledge-graph.js   # 知识图谱（Cytoscape.js）
│   ├── hero-sketch.js      # 主页粒子动画（纯 CSS，无外部依赖）
│   ├── integrations/       # 第三方库集成封装层（懒加载）
│   │   ├── genome-browser.js    # 基因组浏览器（igv.js）
│   │   ├── rdkit-viewer.js      # SMILES → 2D 分子（RDKit）
│   │   ├── molecule-viewer.js   # 3D 分子查看（3Dmol.js）
│   │   ├── sketch-pad.js        # 手绘白板（Excalidraw）
│   │   ├── kaplay-games.js      # 2D 教育游戏（KAPLAY）
│   │   ├── irt-enhanced.js      # IRT 能力估计增强
│   │   ├── bkt-engine.js        # 贝叶斯知识追踪
│   │   ├── study-heatmap.js     # 学习热力图（cal-heatmap）
│   │   ├── analytics-charts.js  # 学习分析图表（Chart.js）
│   │   ├── diagram-renderer.js  # 流程图/时序图（Mermaid）
│   │   ├── document-tools.js   # PDF/Word 解析（PDF.js/mammoth）
│   │   ├── community-enhanced.js# 社区聊天（quikchat）
│   │   ├── ai-chat-enhanced.js # AI 对话（marked 渲染）
│   │   ├── data-store.js        # 数据导出（JSZip）
│   │   └── vendor-init.js       # 第三方库初始化
│   └── vendor/             # 第三方库本地副本（24 个，见下方依赖表）
├── data/                   # 题库与卡片数据（JSON）
├── sql/                    # 数据库 Schema 与迁移
└── fonts/                  # 本地字体（LXGW WenKai）
```

---

## 功能模块

| 模块 | 路由 | 说明 |
|------|------|------|
| 知识卡片 | `/cards` | Anki 风格翻转卡，FSRS 算法安排复习 |
| 模拟试题 | `/practice` | 随机组卷、自动评分、错题收集 |
| 联考模考 | `/exam` | 限时模考，仿真题 |
| 错题本 | `/wrongbook` | 错题录入 + AI 分析 + OCR 识别 |
| 拍照录题 | `/photo-quiz` | OCR 识别题目，AI 生成选项与解析 |
| AI 导师 | `/tutor` | 流式问答，支持图片上传、SVG 渲染 |
| AI 课堂 | `/classroom` | AI 生物学课堂（含播放器） |
| 学科讨论 | `/discussion` | 遗传学/生态学等学科智能体多轮讨论 |
| 学习管理 | `/study` | 课程表/待办/番茄钟/笔记/倒计时/工具 |
| 虚拟实验室 | `/bio-lab` | 步骤引导 + AI 实时引导 |
| PhET 互动模拟 | `/phet-sims` | 8 个 PhET 互动模拟 iframe 嵌入（CC BY 4.0） |
| 生物动画 | `/bio-animation` | 生物过程动画演示 |
| 知识图谱 | `/knowledge-graph` | 概念网络可视化（Cytoscape.js） |
| 基因组浏览器 | `/genome` | igv.js 交互式基因组浏览，含 8 个竞赛常考基因预设 |
| 分子结构 (SMILES) | `/smiles` | SMILES → 2D 分子结构绘制（RDKit） |
| 3D 分子查看 | `/molecules` | 3D 分子查看器，PDB 格式（3Dmol.js） |
| 手绘画板 | `/sketch` | 手绘风格白板，生物结构草图（Excalidraw） |
| 互动游戏 | `/games` | 2D 教育游戏引擎（细胞/器官拼装） |
| 学习分析 | `/dashboard` | 热力图、雷达图、趋势图（Chart.js + cal-heatmap） |
| 社区 | `/community` | 实时聊天 + 发帖/评论（quikchat） |
| 教师模式 | `/teacher` | 题库管理、学生管理（需 user_key 验证） |

---

## 关键算法

<details>
<summary><b>FSRS 间隔重复算法</b>（点击展开）</summary>

采用 FSRS（Free Spaced Repetition Scheduler）替代传统 SM-2，基于记忆三成分模型（稳定度 S / 可检索性 R / 难度 D）动态计算下次复习时间。底层引擎使用官方 [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)（MIT License），`js/fsrs-algorithm.js` 为兼容包装层。

```js
// ts-fsrs 官方引擎调度（内部实现）
const scheduler = tsFsrs.fsrs({ request_retention: 0.9, maximum_interval: 36500, enable_fuzz: true });
const result = scheduler.next(card, now, Rating.Good);
// 返回 BioQuest 兼容格式
{ stability, difficulty, retrievability, interval, dueDate, repetitions, lapses }
```

用户自评难度（再次 / 困难 / 良好 / 容易）映射为评分 1-4，驱动稳定度与难度更新。详见 `js/fsrs-algorithm.js` 与 `js/fsrs-optimizer.js`（参数优化）。

</details>

<details>
<summary><b>IRT 项目反应理论</b>（能力估计）</summary>

基于 3PL 模型的项目反应理论，从作答记录估计学生能力 θ：

- **底层引擎**：[@geekie/irt](https://github.com/geekie/irt)（MIT）提供 3PL 似然估计
- **BioQuest 封装**：`js/irt-engine.js` + `js/integrations/irt-enhanced.js`，将题目参数（区分度 a / 难度 b / 猜测 c）与作答响应转为能力估计
- **BKT 知识追踪**：`js/integrations/bkt-engine.js` 实现贝叶斯知识追踪，估算每知识点掌握概率

</details>

<details>
<summary><b>OCR 双引擎管线</b>（视觉模型优先 + Tesseract 兜底）</summary>

为提升中英文识别准确率并支持斜体，采用双层架构：

1. **视觉模型优先**：若用户配置了 API Key，调用 GLM-4V / Qwen-VL / Llama-Vision 等多模态模型，prompt 要求用 Markdown `*斜体*` 标记斜体文字、保留 LaTeX 公式
2. **图像预处理**（Tesseract 路径）：2x 放大 → 灰度化 → 对比度线性拉伸 → 二值化（阈值 140）
3. **Tesseract 兜底**：WASM 引擎 + `chi_sim+eng` 语言包，PSM 6（单一文本块）优先，失败回退 PSM 3（全自动）
4. **后处理修正**：10 条正则修正常见错字（行末标点、全角空格、断行等号、括号空格等）

```js
// 预处理：对比度线性拉伸
const min = Math.min(...gray), max = Math.max(...gray);
const stretched = gray.map(v => ((v - min) / (max - min)) * 255);
// 二值化
const bin = stretched.map(v => v > 140 ? 255 : 0);
```

详见 `js/wrongbook.js` 的 `_preprocessImage` / `_runTesseractOcr` / `_postprocessOcrText`，`js/photo-quiz.js` 的 `_ocrImage`。

</details>

<details>
<summary><b>AI 流式渲染</b>（增量 textContent + 完成后 Markdown）</summary>

为避免长文本 O(n²) 性能退化，流式阶段使用 `textContent` 增量追加，完成后再一次性 Markdown 渲染：

```js
// 流式阶段：纯文本追加，O(1) 每帧
chunkEl.textContent += delta;
// 完成后：调用 marked（MIT）渲染，DOMPurify 过滤 XSS
finalEl.innerHTML = DOMPurify.sanitize(marked.parse(text));
renderSvgCodeBlocks(finalEl);  // 提取 ```svg 块并渲染为内联 SVG
```

所有 `[[ANIM:xxx]]` 动画标签在流式输出前通过 `_extractAnim` 正则过滤。详见 `js/integrations/ai-chat-enhanced.js`。

</details>

<details>
<summary><b>主页粒子动画「Cytoplasmic Drift」</b>（纯 CSS 实现）</summary>

隐喻细胞质流动的粒子动画，**零外部依赖**：

- **流场**：35 个粒子沿 CSS keyframes 随机轨迹漂移（模拟细胞质流动）
- **生命周期**：粒子有随机延迟与时长，老化后自然重生（细胞生命周期）
- **配色**：Trae 设计色（鼠尾草绿 / 琥珀橙 / 橄榄 / 米色），加性混合发光
- **降级**：CSS 动画兜底，无 JS 计算开销

> 注：原 p5.js Perlin 噪声流场版本已移除（CDN 依赖过重，影响首屏），改为纯 CSS 实现以保证零外部依赖与首屏性能。详见 `js/hero-sketch.js`。

</details>

<details>
<summary><b>番茄钟-待办数据关联</b></summary>

学习管理中心实现待办与番茄钟的双向绑定：

```js
// 待办页：点击 🍅 关联任务，跳转番茄钟
_pomodoroLinkedTask = taskId;
_activeTab = 'pomodoro';
// 番茄完成：自动标记待办进度
const newCount = (task.pomodoro_count || 0) + 1;
await updateStudyTask(linkedTaskId, { pomodoro_count: newCount });
```

底部「今日学习节奏」常驻卡片实时聚合：待办数 / 今日番茄数 / 待复习题数 / 联考倒计时。详见 `js/study.js`。

</details>

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 原生 JavaScript（SPA hash 路由）、CSS3、PWA（Service Worker 离线缓存） |
| 数据 | Supabase（PostgreSQL + Auth + Storage + RLS）+ Dexie.js（IndexedDB ORM） |
| AI | 前端直连 6 家 LLM（SSE 流式）+ 视觉多模态 OCR |
| OCR | Tesseract.js v5（WASM）+ 视觉模型 |
| 可视化 | Chart.js / Cytoscape.js / Mermaid / cal-heatmap / Three.js / 3Dmol.js / igv.js |
| 分子 | RDKit.js（SMILES→2D）+ 3Dmol.js（3D）+ igv.js（基因组） |
| 字体 | LXGW WenKai（本地加载） |
| 设计 | Trae 设计系统（Modern Botanical Laboratory） |

## 开源依赖与许可声明

本项目在 `js/vendor/` 下打包了 24 个第三方开源库（均挑选与 CC BY-NC-SA 4.0 兼容的宽松协议），所有库以本地副本形式存储，不依赖运行时 CDN。完整声明见 [`js/vendor/THIRD_PARTY_LICENSES.txt`](./js/vendor/THIRD_PARTY_LICENSES.txt)。

### 核心依赖

| 依赖 | 许可证 | 用途 | 来源 |
|------|--------|------|------|
| [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | MIT | FSRS-5 间隔重复算法引擎 | 本地副本 |
| [DOMPurify](https://github.com/cure53/DOMPurify) | MPL-2.0 / Apache-2.0 | SVG/HTML XSS 权威过滤器 | 本地副本 |
| [KaTeX](https://github.com/KaTeX/KaTeX) + mhchem | MIT / Apache-2.0 | 数学公式与化学方程式渲染 | 本地副本 |
| [Dexie.js](https://github.com/dexie/Dexie.js) | Apache-2.0 | IndexedDB ORM | 本地副本 |
| [Supabase JS](https://github.com/supabase/supabase-js) | MIT | 数据库/认证/存储客户端 | CDN 回退加载 |

### 可视化与科学计算

| 依赖 | 许可证 | 用途 | 来源 |
|------|--------|------|------|
| [Chart.js](https://github.com/chartjs/Chart.js) | MIT | 学习数据图表 | 本地副本 |
| [Cytoscape.js](https://github.com/cytoscape/cytoscape.js) | MIT | 知识图谱可视化 | 本地副本 |
| [Mermaid](https://github.com/mermaid-js/mermaid) | MIT | 文本转图表（流程图/时序图） | 本地副本 |
| [cal-heatmap](https://github.com/wa0x6e/cal-heatmap) + d3 | MIT / BSD-3 | GitHub 风格学习热力图 | 本地副本 |
| [Three.js](https://github.com/mrdoob/three.js) | MIT | 3D WebGL 渲染 | 本地副本 |
| [3Dmol.js](https://github.com/3dmol/3Dmol.js) | BSD-3 | 3D 分子查看器（PDB） | 本地副本 |
| [RDKit.js](https://github.com/rdkit/rdkit-js) | BSD-3 | SMILES → 2D 分子结构 | 本地副本（含 WASM） |
| [igv.js](https://github.com/igvteam/igv.js) | MIT | 交互式基因组浏览器 | 本地副本（路由懒加载） |
| [@geekie/irt](https://github.com/geekie/irt) | MIT | 3PL 项目反应理论 | 本地副本 |

### 文档与工具

| 依赖 | 许可证 | 用途 | 来源 |
|------|--------|------|------|
| [PDF.js](https://github.com/mozilla/pdf.js) | Apache-2.0 | PDF 文档解析与渲染 | 本地副本 |
| [mammoth.js](https://github.com/mwilliamson/mammoth.js) | BSD-2 | Word .docx 转 HTML | 本地副本 |
| [JSZip](https://github.com/Stuk/jszip) | MIT | ZIP 压缩/解压（数据导出） | 本地副本 |
| [GSAP](https://github.com/greensock/GSAP) | MIT | 高性能动画引擎 | 本地副本 |

### UI 与交互

| 依赖 | 许可证 | 用途 | 来源 |
|------|--------|------|------|
| [React](https://github.com/facebook/react) + ReactDOM | MIT | UI 框架（Excalidraw 依赖） | 本地副本 |
| [Excalidraw](https://github.com/excalidraw/excalidraw) | MIT | 手绘风格白板 | 本地副本 |
| [KAPLAY](https://github.com/kaplayjs/kaplay) | MIT | 2D 教育游戏引擎 | 本地副本 |
| [quikchat](https://github.com/oviava/quikchat) | BSD-2 | 实时聊天 UI | 本地副本 |
| [marked](https://github.com/markedjs/marked) | MIT | Markdown 解析 | 本地副本 |
| [Tesseract.js](https://github.com/naptha/tesseract.js) | Apache-2.0 | OCR 文字识别（WASM） | CDN 加载 |
| [LXGW WenKai](https://github.com/lxgw/LxgwWenKai) | OFL-1.1 | 中文字体 | 本地文件 |
| [PhET Interactive Simulations](https://phet.colorado.edu) | CC BY 4.0 | 8 个生物互动模拟 | iframe 嵌入 |

### 已移除的依赖（精简优化）

以下依赖因非核心或与现有功能重复已移除，详见 [`js/vendor/THIRD_PARTY_LICENSES.txt`](./js/vendor/THIRD_PARTY_LICENSES.txt)：

- **p5.js**（LGPL-2.1）— 首页 hero 动画，已用纯 CSS 替代
- **canvas-confetti**（ISC）— 测验庆祝动画，纯装饰
- **Popper.js**（MIT）— tooltip 定位，已用原生 CSS 替代
- **highlight.js**（BSD-3）— 代码语法高亮，生物竞赛场景不需要
- **giscus**（MIT）— GitHub Discussions 评论区，与 quikchat 重复

> **ts-fsrs 特别说明**：`js/vendor/ts-fsrs.umd.min.js` 是 [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) 的 UMD 构建本地副本，版权归 Open Spaced Repetition 所有，遵循 MIT 许可证。`js/fsrs-algorithm.js` 是基于 ts-fsrs 的兼容包装层，提供 BioQuest 原有的 `window.FSRS` API。

> **DOMPurify 特别说明**：`js/vendor/purify.min.js` 是 [DOMPurify](https://github.com/cure53/DOMPurify) 的官方 UMD 构建本地副本，版权归 Cure53 所有，遵循 MPL-2.0 / Apache-2.0 双许可证。BioQuest 未对 DOMPurify 源码做任何修改，仅通过 `window.DOMPurify.sanitize()` 调用其 API。

> **igv.js 特别说明**：`js/vendor/igv.min.js` 是 [igv.js](https://github.com/igvteam/igv.js) 的 UMD 构建本地副本（MIT），版权归 Broad Institute 所有。`js/integrations/genome-browser.js` 为本仓库自实现封装层，采用路由级懒加载（访问 `#/genome` 时才注入 ~1.5MB 脚本），不阻塞首屏。运行时需联网从 Broad Institute S3 拉取参考基因组与 refGene 注释数据。

> **PhET 特别说明**：本项目通过 iframe 嵌入 [PhET Interactive Simulations](https://phet.colorado.edu) 官方 HTML5 模拟文件，版权归 University of Colorado Boulder 所有，遵循 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 许可证。BioQuest **未修改 PhET 任何源代码**，仅通过 iframe 引用并展示署名。

## 安全说明

### 已实施的安全措施

- `.env` 被 `.gitignore` 忽略，密钥不进入仓库
- Supabase anon key 公开但受 RLS 策略保护，service_role key 绝不前端使用
- 用户 API Key 仅存 localStorage，UI 显示掩码（`****last4`），每用户每日 100 次限额
- 教师模式使用 SHA-256 哈希校验管理密钥，明文不入源码；登录速率限制（5 次失败锁定 60 秒，渐进式延迟）
- 管理员会话 token 使用 JSON 时间戳格式（5 分钟过期），存储于 sessionStorage
- **SVG XSS 防护**：用户/AI 生成的 SVG 内容使用 [DOMPurify](https://github.com/cure53/DOMPurify) 过滤，禁用 `foreignObject`、`script`、`style` 属性及所有 `on*` 事件处理器。DOMPurify 未加载时降级为多层正则过滤。
- **CSP 防御**：`.htaccess` 配置 Content-Security-Policy，限制 script-src 至 CDN 白名单，frame-src 至 PhET/diagrams.net，connect-src 至具体 AI 服务商域名
- **退出登录保护用户数据**：forceLogout 仅清理认证相关 localStorage 键，保留学习记录、错题本等用户数据

### 已知架构限制（纯前端固有的安全边界）

| 限制 | 说明 | 缓解措施 |
|------|------|---------|
| 客户端速率限制可绕过 | 攻击者可清空 sessionStorage 重置尝试次数 | 服务器端最终防线（Supabase RLS + AI 服务商配额）兜底 |
| CSP 仍保留 `'unsafe-inline'` | 现有内联代码（`<script>` 块、`onclick` 等）需要此权限 | DOMPurify 提供 SVG 输入的纵深防御；长期计划移除内联脚本 |
| 管理员密钥哈希可暴力破解 | 攻击者可下载前端代码离线爆破 | 哈希使用 SHA-256 + 渐进式延迟 + 锁定机制；密钥建议 16+ 字符高熵 |

## License

[CC BY-NC-SA 4.0](./LICENSE) — 署名-非商业性使用-相同方式共享 4.0 国际许可证。详见上文「作者附加声明」中对「非商业性」的宽松解释——**教育使用不受限，禁止软件转售**。
