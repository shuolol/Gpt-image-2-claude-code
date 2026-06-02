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

> 如果你已经有 Huoke 后端服务，也可以用 `huoke-image` 命令连接你自己的服务。

### 安装（小白 3 步）

#### 第 1 步：克隆项目

打开终端（Mac 按 `Cmd+空格` 搜 "Terminal"，Windows 按 `Win+R` 输入 `cmd`），输入：

```bash
git clone https://github.com/shuolol/Gpt-image-2-claude-code.git
cd Gpt-image-2-claude-code
```

#### 第 2 步：安装依赖

```bash
npm install
npm run build
```

#### 第 3 步：全局安装（可选，推荐）

```bash
npm install -g .
```

安装成功后，你可以在任何目录直接使用 `magic-image` 和 `huoke-image` 命令。

> **验证安装**：输入 `magic-image --help`，如果看到帮助信息就说明安装成功。

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

#### 1. 文生图（magic-image）

输入一张产品图片 + 描述词，AI 帮你重新生成场景图。

```bash
magic-image -u "https://example.com/product.jpg" -p "放在大理石桌面上，柔和的阳光从窗户照进来"
```

| 参数 | 必填 | 说明 |
|---|---|---|
| `-u, --url` | 是 | 原始产品图片链接 |
| `-p, --prompt` | 是 | 想要生成的场景描述 |
| `-h, --help` | 否 | 查看帮助 |

#### 2. 文生图（huoke-image generate-single）

纯文本生成一张图片。

```bash
huoke-image generate-single -p "一个白色陶瓷咖啡杯，纯白背景，专业产品摄影" --ratio "1:1"
```

| 参数 | 必填 | 说明 |
|---|---|---|
| `-p, --prompt` | 是 | 图片描述 |
| `--ratio` | 否 | 宽高比：1:1 / 16:9 / 9:16 / 4:3 / 3:4 |
| `--resolution` | 否 | 分辨率：1k / 2k / 4k |

#### 3. 图片编辑（huoke-image edit）

对已有图片进行 AI 修改。

```bash
huoke-image edit \
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

#### 4. 多图融合（huoke-image blend）

把多张产品图融合成一张场景图。

```bash
huoke-image blend \
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

#### 5. 批量生成（huoke-image generate-images）

一次生成多张不同类型的产品图（例如主图 + 场景图 + 细节图）。

```bash
huoke-image generate-images \
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
| `NICE_TOKEN_API_KEY` | Nice-Token API Key | `magic-image` |
| `HUOKE_API_URL` | Huoke 后端地址 | `huoke-image` |
| `HUOKE_API_KEY` | Huoke JWT / API Key | `huoke-image` |

### 在 Claude Code 中使用

Claude Code 会自动发现系统中的全局命令。安装后直接对话即可：

```
你：帮我把这张产品图 https://cdn.example.com/shirt.jpg 的背景换成沙滩场景
Claude Code 会自动调用：magic-image -u "..." -p "beach background"
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

> If you have your own Huoke backend server, `huoke-image` can connect to it.

### Installation (3 steps)

#### Step 1: Clone the repo

```bash
git clone https://github.com/shuolol/Gpt-image-2-claude-code.git
cd Gpt-image-2-claude-code
```

#### Step 2: Install dependencies

```bash
npm install
npm run build
```

#### Step 3: Install globally (optional, recommended)

```bash
npm install -g .
```

> **Verify**: Run `magic-image --help`. If you see help text, installation succeeded.

### Set API Key

```bash
# macOS / Linux
export NICE_TOKEN_API_KEY="sk-your-key-here"

# Windows PowerShell
$env:NICE_TOKEN_API_KEY="sk-your-key-here"

# Windows CMD
set NICE_TOKEN_API_KEY=sk-your-key-here
```

> **Permanent**: Add the export line to `~/.bashrc` or `~/.zshrc`.

### Quick Start

#### 1. Generate Image (magic-image)

```bash
magic-image -u "https://example.com/product.jpg" -p "Place the product on a marble table with soft sunlight"
```

#### 2. Generate Single Image (huoke-image)

```bash
huoke-image generate-single -p "A white ceramic coffee mug, clean white background, professional product photography" --ratio "1:1"
```

#### 3. Edit Image (huoke-image edit)

```bash
huoke-image edit \
  --image-url "https://example.com/product.jpg" \
  -p "Replace background with a sunny beach, keep the product unchanged" \
  --ratio "1:1"
```

#### 4. Blend Images (huoke-image blend)

```bash
huoke-image blend \
  --image-urls "https://example.com/img1.jpg,https://example.com/img2.jpg" \
  -p "Place both products on a wooden dining table with some greenery" \
  --ratio "16:9"
```

#### 5. Batch Generate (huoke-image generate-images)

```bash
huoke-image generate-images \
  --product-info '{"name":"Ceramic Mug","category":"Kitchen"}' \
  --configs '{"main":1,"scene":2,"detail":1}' \
  --image-url "https://example.com/product.jpg" \
  --ratio "1:1"
```

### Environment Variables

| Variable | Purpose | Used By |
|---|---|---|
| `NICE_TOKEN_API_KEY` | Nice-Token API Key | `magic-image` |
| `HUOKE_API_URL` | Huoke backend URL | `huoke-image` |
| `HUOKE_API_KEY` | Huoke JWT / API Key | `huoke-image` |

### Using with Claude Code

Claude Code auto-discovers globally installed CLI commands. After installation, just talk to it:

```
You: "Generate a product image from https://cdn.example.com/shirt.jpg with a beach background"
Claude Code will call: magic-image -u "..." -p "beach background"
```

No plugins, no MCP config needed.

### API Contract

All 5 endpoints use `Authorization: Bearer <token>` auth and return `{ code: 200, msg: "success", data: ["url"] }` on success (SSE for batch).

| Endpoint | CLI | Response |
|---|---|---|
| `img.nice-token.com/api/v1/product/edit-image` | `magic-image` | JSON |
| `/api/v1/product/generate-single-image` | `huoke-image generate-single` | JSON |
| `/api/v1/product/edit-image` | `huoke-image edit` | JSON |
| `/api/v1/product/blend-images` | `huoke-image blend` | JSON |
| `/api/v1/product/generate-images` | `huoke-image generate-images` | SSE stream |

### Development

```bash
npm install
npm run build        # Compile TypeScript → dist/
npm run dev -- -u "https://example.com/img.jpg" -p "test"
```
