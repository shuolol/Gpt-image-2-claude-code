# GPT-Image-2 Claude Code

[English](#english) | [中文](#chinese)

AI 产品图片生成命令行工具，专为 **Claude Code** 及其他 AI Agent 设计。支持文生图、图片编辑、多图融合、批量生成。

---

<a id="chinese"></a>

## 中文教程

### 这是什么？

一个可以在终端里直接生成/编辑产品图片的命令行工具。**Claude Code、OpenCode、Codex 等 AI Agent 都能自动发现并调用它**，就像调用一个内置函数一样简单。

### 前置要求

- **Node.js >= 18**（[下载安装](https://nodejs.org/)）
- 一个 Nice-Token API Key（用于文生图/编辑/融合）

### 安装

#### Claude Code（一行命令）

```bash
git clone https://github.com/shuolol/Gpt-image-2-claude-code.git ~/.claude/skills/nice-image \
  && bash ~/.claude/skills/nice-image/install.sh
```

安装脚本会自动：装依赖 → 编译 → 全局安装 CLI → 配置环境变量 → 可选跑冒烟测试。

装完之后下一次有图像请求 Claude 自动发现 skill——不用重启，不用注册。

**Windows PowerShell 安装：**

```powershell
# 1. 先克隆仓库
git clone https://github.com/shuolol/Gpt-image-2-claude-code.git $env:USERPROFILE\.claude\skills\nice-image

# 2. 运行 PowerShell 安装脚本
powershell -ExecutionPolicy Bypass -File $env:USERPROFILE\.claude\skills\nice-image\install.ps1
```

> Windows 下用 `[Environment]::SetEnvironmentVariable` 持久化 API Key，重启终端后自动生效。

#### Codex（或任何扫描 `~/.agents/skills/` 的 agent）

```bash
git clone https://github.com/shuolol/Gpt-image-2-claude-code.git ~/.agents/skills/nice-image \
  && bash ~/.agents/skills/nice-image/install.sh
```

#### OpenClaw（一行命令）

```bash
git clone https://github.com/shuolol/Gpt-image-2-claude-code.git ~/.openclaw/skills/nice-image \
  && bash ~/.openclaw/skills/nice-image/install.sh
```

#### 手动 / 其他 agent / 直接命令行

```bash
git clone https://github.com/shuolol/Gpt-image-2-claude-code.git
cd Gpt-image-2-claude-code

npm install && npm run build && npm install -g .

export NICE_TOKEN_API_KEY="sk-你的key"

nice-image -u "https://example.com/product.jpg" -p "放在白色背景上，摄影棚灯光"
```

> **验证安装**：输入 `nice-image --help`，如果看到帮助信息就说明安装成功。

### 设置 API Key

```bash
# macOS / Linux
export NICE_TOKEN_API_KEY="sk-你的key"

# Windows PowerShell
$env:NICE_TOKEN_API_KEY="sk-你的key"

# Windows CMD
set NICE_TOKEN_API_KEY=sk-你的key
```

> **永久保存**：把上面这行加到 `~/.bashrc` 或 `~/.zshrc` 文件末尾，以后每次打开终端自动生效。

### 快速上手

#### 1. 文生图（nice-image）

输入一张产品图片 + 描述词，AI 帮你重新生成场景图。

```bash
nice-image -u "https://example.com/product.jpg" -p "放在大理石桌面上，柔和的阳光从窗户照进来"
```

| 参数 | 必填 | 说明 |
|---|---|---|
| `-u, --url` | 是 | 原始产品图片链接 |
| `-p, --prompt` | 是 | 想要生成的场景描述 |
| `-h, --help` | 否 | 查看帮助 |

#### 2. 文生图（nice-image generate-single）

纯文本生成一张图片。

```bash
nice-image generate-single -p "一个白色陶瓷咖啡杯，纯白背景，专业产品摄影" --ratio "1:1"
```

| 参数 | 必填 | 说明 |
|---|---|---|
| `-p, --prompt` | 是 | 图片描述 |
| `--ratio` | 否 | 宽高比：1:1 / 16:9 / 9:16 / 4:3 / 3:4 |
| `--resolution` | 否 | 分辨率：1k / 2k / 4k |

#### 3. 图片编辑（nice-image edit）

对已有图片进行 AI 修改。

```bash
nice-image edit-image \
  --image-url "https://example.com/product.jpg" \
  -p "把背景换成阳光沙滩海岸，保持产品不变" \
  --ratio "1:1"
```

| 参数 | 必填 | 说明 |
|---|---|---|
| `-p, --prompt` | 是 | 编辑指令 |
| `--image-url` | * | 原图链接 |
| `--image-base64` | * | 原图 base64 |
| `--mask-url` | 否 | 蒙版图片链接（指定修改区域） |
| `--model` | 否 | 模型名（默认 gpt-image-2） |
| `--resolution` | 否 | 1k / 2k / 4k |
| `--ratio` | 否 | 宽高比 |

\* `--image-url` 和 `--image-base64` 至少填一个。

#### 4. 多图融合（nice-image blend）

把多张产品图融合成一张场景图。

```bash
nice-image blend \
  --image-urls "https://example.com/img1.jpg,https://example.com/img2.jpg" \
  -p "把这两个产品放在一张木质餐桌上，旁边有一些绿植装饰" \
  --ratio "16:9"
```

| 参数 | 必填 | 说明 |
|---|---|---|
| `-p, --prompt` | 是 | 融合描述 |
| `--image-urls` | * | 逗号分隔的图片链接 |
| `--image-base64s` | * | 逗号分隔的 base64 图片 |
| `--model` | 否 | 模型名 |
| `--resolution` | 否 | 1k / 2k / 4k |
| `--ratio` | 否 | 宽高比 |

#### 5. 批量生成（nice-image generate-images）

一次生成多张不同类型的产品图（例如主图 + 场景图 + 细节图）。

```bash
nice-image generate-images \
  --product-info '{"name":"陶瓷马克杯","category":"厨房用品"}' \
  --configs '{"main":1,"scene":2,"detail":1}' \
  --image-url "https://example.com/product.jpg" \
  --ratio "1:1"
```

| 参数 | 必填 | 说明 |
|---|---|---|
| `--product-info` | 是 | 产品信息 JSON（或 `@文件路径.json`） |
| `--configs` | 是 | 图片类型和数量，如 `{"main":1,"scene":2}` |
| `--image-url` | 否 | 原图链接 |
| `--resolution` | 否 | 1k / 2k / 4k |
| `--ratio` | 否 | 宽高比 |
| `--language` | 否 | 输出语言 |

### 环境变量总览

| 变量名 | 用途 | 哪个工具用 |
|---|---|---|
| `NICE_TOKEN_API_KEY` | Nice-Token API Key | `nice-image` |
| `HUOKE_API_URL` | Huoke 后端地址 | `nice-image` |
| `HUOKE_API_KEY` | Huoke JWT / API Key | `nice-image` |

### 在 Claude Code 中使用

Claude Code 会自动发现系统中的全局命令。安装后直接对话即可：

```
你：帮我把这张产品图 https://cdn.example.com/shirt.jpg 的背景换成沙滩场景
Claude Code 会自动调用：nice-image -u "..." -p "beach background"
```

无需任何插件或 MCP 配置。

> **提示**：如果想省去每次手动输入 Key，可以在项目根目录创建 `.env` 文件：
> ```
> NICE_TOKEN_API_KEY=sk-你的key
> ```

---

<a id="english"></a>

## English Tutorial

### What is this?

A CLI tool for AI product image generation and editing, designed for **Claude Code** and other AI Agents. Supports text-to-image, image editing, multi-image blending, and batch generation.

### Prerequisites

- **Node.js >= 18** ([Download](https://nodejs.org/))
- A Nice-Token API Key (for generation/edit/blend)

> If you have your own Huoke backend server, `nice-image` can connect to it.

### Installation

#### Claude Code (one-liner)

```bash
git clone https://github.com/shuolol/Gpt-image-2-claude-code.git ~/.claude/skills/nice-image \
  && bash ~/.claude/skills/nice-image/install.sh
```

The installer handles: dependencies → build → global CLI install → env var config → optional smoke test.

After install, Claude auto-discovers the skill on the next image request — no restart, no registration.

**Windows PowerShell install:**

```powershell
# 1. Clone the repo first
git clone https://github.com/shuolol/Gpt-image-2-claude-code.git $env:USERPROFILE\.claude\skills\nice-image

# 2. Run the PowerShell installer
powershell -ExecutionPolicy Bypass -File $env:USERPROFILE\.claude\skills\nice-image\install.ps1
```

> On Windows, `[Environment]::SetEnvironmentVariable` persists the API key — it takes effect after restarting the terminal.

#### Codex (or any agent scanning `~/.agents/skills/`)

```bash
git clone https://github.com/shuolol/Gpt-image-2-claude-code.git ~/.agents/skills/nice-image \
  && bash ~/.agents/skills/nice-image/install.sh
```

#### OpenClaw (one-liner)

```bash
git clone https://github.com/shuolol/Gpt-image-2-claude-code.git ~/.openclaw/skills/nice-image \
  && bash ~/.openclaw/skills/nice-image/install.sh
```

#### Manual / other agents / direct CLI

```bash
git clone https://github.com/shuolol/Gpt-image-2-claude-code.git
cd Gpt-image-2-claude-code

npm install && npm run build && npm install -g .

export NICE_TOKEN_API_KEY="sk-your-key-here"

nice-image -u "https://example.com/product.jpg" -p "White background, studio lighting"
```

> **Verify**: Run `nice-image --help`. If you see help text, installation succeeded.

### Quick Start

#### 1. Generate Image (nice-image)

```bash
nice-image -u "https://example.com/product.jpg" -p "Place the product on a marble table with soft sunlight"
```

#### 2. Generate Single Image (nice-image)

```bash
nice-image generate-single -p "A white ceramic coffee mug, clean white background, professional product photography" --ratio "1:1"
```

#### 3. Edit Image (nice-image edit-image)

```bash
nice-image edit-image \
  --image-url "https://example.com/product.jpg" \
  -p "Replace background with a sunny beach, keep the product unchanged" \
  --ratio "1:1"
```

#### 4. Blend Images (nice-image blend)

```bash
nice-image blend \
  --image-urls "https://example.com/img1.jpg,https://example.com/img2.jpg" \
  -p "Place both products on a wooden dining table with some greenery" \
  --ratio "16:9"
```

#### 5. Batch Generate (nice-image generate-images)

```bash
nice-image generate-images \
  --product-info '{"name":"Ceramic Mug","category":"Kitchen"}' \
  --configs '{"main":1,"scene":2,"detail":1}' \
  --image-url "https://example.com/product.jpg" \
  --ratio "1:1"
```

### Environment Variables

| Variable | Purpose | Used By |
|---|---|---|
| `NICE_TOKEN_API_KEY` | Nice-Token API Key | `nice-image` |
| `HUOKE_API_URL` | Huoke backend URL | `nice-image` |
| `HUOKE_API_KEY` | Huoke JWT / API Key | `nice-image` |

### Using with Claude Code

Claude Code auto-discovers globally installed CLI commands. After installation, just talk to it:

```
You: "Generate a product image from https://cdn.example.com/shirt.jpg with a beach background"
Claude Code will call: nice-image -u "..." -p "beach background"
```

No plugins, no MCP config needed.

### API Contract

All 5 endpoints use `Authorization: Bearer <token>` auth and return `{ code: 200, msg: "success", data: ["url"] }` on success (SSE for batch).

| Endpoint | CLI | Response |
|---|---|---|
| `img.nice-token.com/api/v1/product/edit-image` | `nice-image` | JSON |
| `/api/v1/product/generate-single-image` | `nice-image generate-single` | JSON |
| `/api/v1/product/edit-image` | `nice-image edit-image` | JSON |
| `/api/v1/product/blend-images` | `nice-image blend` | JSON |
| `/api/v1/product/generate-images` | `nice-image generate-images` | SSE stream |

### Development

```bash
npm install
npm run build        # Compile TypeScript → dist/
npm run dev -- -u "https://example.com/img.jpg" -p "test"
```
