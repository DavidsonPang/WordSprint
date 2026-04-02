# WordSprint 记单词应用 - 设计文档

**文档版本**: 1.0
**创建日期**: 2026-04-02
**设计状态**: 已确认

---

## Context（背景与需求）

### 项目背景

WordSprint 是一款面向儿童英语学习的记单词应用，主要服务于小孩在日常学习中遇到的单词记录、备考（Ket/Pet）词汇学习，以及老师布置的背诵任务。

### 核心问题

- 小孩在课内外遇到不会的单词需要便捷地记录下来
- 备考Ket/Pet等英语考试需要系统化的词库支持
- 日常老师布置的单词背诵任务需要有效管理
- 家长需要参与辅助录入和查看学习进度
- 需要科学的复习计划帮助巩固记忆

### 目标用户

- **主要用户**: 小学至初中阶段的学生（7-14岁）
- **辅助用户**: 家长（帮助录入、监督进度）
- **使用场景**: 家庭学习环境，偶尔在学校或外出时使用

### 成功标准

1. 录入单词快速便捷（支持手动、拍照、语音三种方式）
2. 学习过程有趣且有效（卡片模式 + 多种测验题型）
3. 复习计划科学（艾宾浩斯遗忘曲线）
4. 界面友好适合小孩使用（色彩明快、图标可爱）
5. 部署简单（本地/局域网部署，支持多设备同步）

---

## 整体架构

### 技术栈

**选型: Next.js 全栈框架**

- **前端**: Next.js 14 (App Router) + React + TailwindCSS
- **后端**: Next.js API Routes
- **数据库**: SQLite（默认，本地部署）/ PostgreSQL（云部署）
- **ORM**: Prisma
- **部署**: Docker 一键部署

**优势**:
- 一套代码实现前后端，开发效率高
- 部署极其简单（`npm run build && npm start`）
- 天然支持服务端渲染，首屏加载快
- 响应式设计易于实现，适配PC和移动端

### 系统架构图

```
┌─────────────────────────────────────────────┐
│           浏览器客户端 (多设备)              │
│  ┌────────────┐  ┌────────────┐            │
│  │  PC浏览器  │  │ 手机浏览器 │            │
│  └────────────┘  └────────────┘            │
└──────────────┬──────────────────────────────┘
               │ HTTP/HTTPS
               ▼
┌──────────────────────────────────────────────┐
│         Next.js 全栈应用服务器               │
│  ┌─────────────────────────────────────┐    │
│  │     前端层 (React Components)       │    │
│  │   - 词库管理                        │    │
│  │   - 单词录入（手动/拍照/语音）      │    │
│  │   - 学习模式（卡片/测验）           │    │
│  │   - 统计分析                        │    │
│  │   - 学习者档案管理                  │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │     后端层 (API Routes)             │    │
│  │   - 单词CRUD API                    │    │
│  │   - AI服务集成（LLM/OCR/TTS）       │    │
│  │   - 学习进度跟踪                    │    │
│  │   - 复习计划生成                    │    │
│  └─────────────────────────────────────┘    │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│          SQLite/PostgreSQL 数据库            │
│  - 学习者档案表 (learners)                   │
│  - 词库表 (wordbooks)                        │
│  - 单词表 (words)                            │
│  - 学习记录表 (learning_records)             │
│  - 复习计划表 (review_schedule)              │
└──────────────────────────────────────────────┘

        ┌───────────────────────────┐
        │     外部AI服务 (可选)      │
        │  - 多模态LLM (拍照识别)    │
        │  - Whisper API (语音识别)  │
        │  - 在线词典API (查词)       │
        │  - OCR服务 (降级方案)       │
        └───────────────────────────┘
```

### 部署架构

**支持两种部署模式**:

1. **局域网模式** (推荐优先)
   - 在家中任意设备（旧电脑、树莓派、NAS）运行 Docker 容器
   - 家庭设备通过 WiFi 连接
   - 数据存储在本地，隐私性强
   - 外出时各设备独立使用，回家后刷新页面同步

2. **云部署模式**
   - 部署到云服务器（阿里云/腾讯云）
   - 配置域名和SSL证书
   - 随时随地可访问
   - 数据在云端，需要做好安全防护

**数据同步方案**:
- 无需特殊同步机制（WebSocket/轮询）
- 所有数据存储在服务器数据库
- 客户端打开页面时从服务器加载最新数据
- 用户需要查看更新时手动刷新页面

---

## 数据模型

### 数据库表设计

#### 1. 学习者档案表 (learners)

```sql
CREATE TABLE learners (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,                    -- 学习者姓名
  avatar        TEXT,                             -- 头像URL或emoji
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**说明**: 支持创建多个学习者档案（如"小明"、"小红"），数据完全隔离。

#### 2. 词库表 (wordbooks)

```sql
CREATE TABLE wordbooks (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,                    -- 词库名称
  type          TEXT NOT NULL,                    -- 类型: preset(预设)/custom(自定义)
  category      TEXT,                             -- 分类: ket/pet/课内/课外
  description   TEXT,                             -- 描述
  is_builtin    BOOLEAN DEFAULT FALSE,            -- 是否内置词库
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**预设词库**:
- Ket词库 (内置350个单词)
- Pet词库 (内置500个单词)
- 课内词汇 (用户自己创建)
- 课外词汇 (用户自己创建)

#### 3. 单词表 (words)

```sql
CREATE TABLE words (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  wordbook_id     INTEGER NOT NULL,               -- 所属词库
  learner_id      INTEGER NOT NULL,               -- 所属学习者
  word            TEXT NOT NULL,                  -- 单词
  phonetic_us     TEXT,                           -- 美式音标
  phonetic_uk     TEXT,                           -- 英式音标
  meaning_cn      TEXT,                           -- 中文释义
  meaning_en      TEXT,                           -- 英文释义
  examples        TEXT,                           -- 例句(JSON格式)
  image_url       TEXT,                           -- 单词配图URL
  source          TEXT,                           -- 来源（如"牛津阅读L5"）
  mastery_level   INTEGER DEFAULT 0,              -- 掌握程度: 0-不会/1-模糊/2-掌握
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wordbook_id) REFERENCES wordbooks(id),
  FOREIGN KEY (learner_id) REFERENCES learners(id)
);
```

**examples 字段格式** (JSON):
```json
[
  {
    "en": "I ate an apple for breakfast.",
    "cn": "我早餐吃了一个苹果。"
  }
]
```

#### 4. 学习记录表 (learning_records)

```sql
CREATE TABLE learning_records (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id    INTEGER NOT NULL,
  word_id       INTEGER NOT NULL,
  study_type    TEXT NOT NULL,                    -- 学习类型: card(卡片)/test(测验)
  test_type     TEXT,                             -- 测验类型: word2meaning/meaning2word/listen/spell
  is_correct    BOOLEAN,                          -- 是否答对(仅测验)
  timestamp     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (learner_id) REFERENCES learners(id),
  FOREIGN KEY (word_id) REFERENCES words(id)
);
```

#### 5. 复习计划表 (review_schedule)

```sql
CREATE TABLE review_schedule (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id        INTEGER NOT NULL,
  word_id           INTEGER NOT NULL,
  next_review_date  DATE NOT NULL,               -- 下次复习日期
  review_count      INTEGER DEFAULT 0,           -- 已复习次数
  last_review_date  DATE,                        -- 上次复习日期
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (learner_id) REFERENCES learners(id),
  FOREIGN KEY (word_id) REFERENCES words(id),
  UNIQUE(learner_id, word_id)
);
```

---

## 功能模块

### 1. 学习者管理模块

**功能**:
- 创建学习者档案（输入姓名、选择头像）
- 切换学习者（顶部导航栏下拉选择）
- 每个学习者的数据完全隔离

**实现要点**:
- 本地存储当前选中的学习者ID（localStorage）
- 所有API请求携带 learner_id 参数
- 前端全局状态管理当前学习者信息

### 2. 词库管理模块

**功能**:
- 查看所有词库列表（预设词库 + 自定义词库）
- 创建自定义词库（输入名称、选择分类）
- 切换当前词库（顶部导航栏下拉选择）
- 导入词库（上传Excel/CSV文件批量导入）
- 查看词库详情（单词列表、掌握进度）

**实现要点**:
- 预设词库（Ket/Pet）在首次启动时自动初始化到数据库
- 导入词库支持解析Excel/CSV，字段映射：单词、释义、音标等
- 当前选中的词库ID存储在 localStorage

### 3. 单词录入模块

**3.1 手动输入**

**流程**:
1. 用户输入单词
2. 点击"自动查询释义"按钮
3. 调用免费词典API或LLM获取：音标、中英文释义、例句、配图
4. 展示查询结果供用户确认
5. 用户可编辑后点击"添加到词库"

**API集成**:
- 词典API: 有道词典API / 金山词霸API（免费额度）
- LLM: OpenAI GPT-4 / Claude（生成释义和例句）
- 图片: Unsplash API / Pexels API（搜索单词相关图片）

**3.2 拍照识别**

**流程**:
1. 点击"拍照识别" → 调用设备相机
2. 拍摄书本/试卷中的单词
3. 优先使用多模态LLM（GPT-4V/Claude）识别所有单词
4. 失败则降级到OCR服务（Tesseract/百度OCR）
5. 展示识别结果列表，用户勾选需要添加的单词
6. 批量查询释义 → 逐个确认添加

**技术方案**:
- 前端使用 `<input type="file" accept="image/*" capture="camera">` 调用相机
- 后端接收图片后调用多模态LLM API
- Prompt: "识别图片中的所有英文单词，返回JSON数组格式"
- 降级方案: Tesseract.js（客户端OCR）或百度OCR API

**3.3 语音输入**

**流程**:
1. 点击"语音输入" → 显示麦克风动画
2. 用户说出单词
3. 优先使用 Whisper API 识别（OpenAI）
4. 失败则降级到 Web Speech API（浏览器内置）
5. 识别结果自动填充到输入框
6. 用户确认 → 查询释义 → 添加

**技术方案**:
- Whisper API: 精准度高，支持中英文混合
- Web Speech API: `webkitSpeechRecognition` (免费但准确度一般)

### 4. 学习复习模块

**4.1 单词卡片模式**

**功能**:
- 卡片正面显示单词和音标
- 点击卡片翻转，显示释义和例句
- 点击发音图标播放单词读音（浏览器TTS）
- 底部三个按钮：不会 / 模糊 / 掌握

**交互逻辑**:
- 点击"不会": mastery_level = 0，复习间隔重置为1天
- 点击"模糊": mastery_level = 1，复习间隔缩短
- 点击"掌握": mastery_level = 2，按艾宾浩斯曲线延长复习间隔
- 自动进入下一个单词

**艾宾浩斯复习计划**:
```
第1次复习: 学习后 1天
第2次复习: 第1次复习后 2天
第3次复习: 第2次复习后 4天
第4次复习: 第3次复习后 7天
第5次复习: 第4次复习后 15天
第6次复习: 第5次复习后 30天（标记为长期掌握）
```

如果标记"不会"或"模糊"，复习间隔会重置或缩短。

**4.2 测验模式**

**4种题型**:

1. **看单词选释义**: 显示单词，4个中文释义选项
2. **看释义选单词**: 显示中文释义，4个单词选项
3. **听发音选单词**: 播放发音，4个单词选项
4. **拼写题**: 显示释义和发音，手动输入完整单词

**测验流程**:
1. 从当前词库随机抽取10个单词（可配置数量）
2. 逐题展示，用户作答
3. 答题后立即反馈（对/错，显示正确答案和释义）
4. 完成后显示成绩统计（正确率、答对/答错数）
5. 可查看错题列表
6. 错题自动加入复习计划

**干扰选项生成**:
- 从同词库随机选择3个单词作为干扰项
- 确保干扰项与正确答案不重复

### 5. 统计分析模块

**展示数据**:

1. **基础统计**:
   - 当前词库总单词数
   - 已掌握数量（mastery_level = 2）
   - 待复习数量（next_review_date <= 今天）
   - 掌握率百分比

2. **学习曲线**:
   - 最近7天每天学习的单词数（折线图或柱状图）
   - 区分新学习和复习

3. **学习日历**:
   - 日历视图显示本月每天的学习情况
   - 有学习的日期高亮显示（类似GitHub贡献图）
   - 不同颜色深度表示学习量

4. **分类统计**:
   - 各词库的掌握进度（Ket/Pet/课内/课外）
   - 每个词库的总数、已掌握数、掌握率

**数据查询**:
- 从 learning_records 表统计学习次数
- 从 words 表统计掌握程度分布
- 按日期聚合生成趋势数据

---

## 界面设计

### 设计风格

- **色彩**: 明快清爽，主色调绿色（#4CAF50），辅助色蓝色（#2196F3）
- **图标**: 使用emoji图标，可爱友好
- **字体**: 系统默认字体，易于阅读
- **布局**: 响应式设计，适配PC和移动端

### 页面结构

**顶部导航栏**:
- 左侧: 品牌Logo "WordSprint"
- 右侧: 当前学习者下拉菜单 + 当前词库下拉菜单

**底部/侧边Tab导航**:
- 移动端: 底部Tab导航
- PC端: 顶部Tab导航或侧边栏

**Tab选项**:
1. 📚 词库 - 词库列表和管理
2. ➕ 添加 - 添加单词（手动/拍照/语音）
3. 📖 学习 - 学习复习（卡片/测验）
4. 📊 统计 - 学习数据统计

### 关键页面

**1. 词库列表页**:
- 显示所有词库（预设 + 自定义）
- 每个词库显示：名称、图标、总单词数、掌握进度
- 点击进入词库详情

**2. 词库详情页**:
- 当前词库的单词列表
- 支持搜索、筛选（按掌握程度）
- 每个单词显示：单词、释义、掌握状态
- 可编辑或删除单词

**3. 添加单词页**:
- 三个Tab切换：手动输入 / 拍照识别 / 语音输入
- 查询结果展示区（音标、释义、例句、配图）
- 确认添加按钮

**4. 学习页**:
- 卡片模式：单词卡片居中显示，支持翻转
- 进度条显示当前学习进度
- 底部操作按钮（不会/模糊/掌握）

**5. 测验页**:
- 顶部显示题号和进度
- 题目区域（根据题型显示不同内容）
- 选项区域（单选或输入框）
- 确认答案按钮

**6. 统计页**:
- 基础统计卡片（总数、已掌握、待复习）
- 学习曲线图表
- 学习日历
- 分类统计列表

---

## 技术实现要点

### 1. AI服务集成

**多模态LLM集成（拍照识别）**:

```typescript
// api/recognize-image.ts
export async function recognizeWords(imageBuffer: Buffer) {
  try {
    // 优先使用 GPT-4V
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "识别图片中的所有英文单词，以JSON数组格式返回，如: [\"apple\", \"banana\"]" },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}` } }
          ]
        }
      ]
    });
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    // 降级到 OCR
    return await fallbackOCR(imageBuffer);
  }
}
```

**Whisper API集成（语音识别）**:

```typescript
// api/speech-to-text.ts
export async function transcribeAudio(audioBlob: Blob) {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');

    const response = await openai.audio.transcriptions.create(formData);
    return response.text;
  } catch (error) {
    // 降级到 Web Speech API（客户端处理）
    throw error;
  }
}
```

**词典API集成**:

```typescript
// api/lookup-word.ts
export async function lookupWord(word: string) {
  // 优先使用免费词典API
  const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);

  if (!response.ok) {
    // 降级使用LLM生成
    return await generateDefinitionWithLLM(word);
  }

  const data = await response.json();
  return {
    word,
    phonetic_us: data[0].phonetics[0]?.text,
    phonetic_uk: data[0].phonetics[1]?.text,
    meaning_cn: await translateToChinese(data[0].meanings[0].definitions[0].definition),
    meaning_en: data[0].meanings[0].definitions[0].definition,
    examples: data[0].meanings[0].definitions[0].example
  };
}
```

### 2. 浏览器TTS发音

```typescript
// utils/tts.ts
export function speak(text: string, lang: 'en-US' | 'en-GB') {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9; // 稍慢的速度
  window.speechSynthesis.speak(utterance);
}
```

### 3. 艾宾浩斯复习计划算法

```typescript
// utils/review-schedule.ts
export function calculateNextReviewDate(
  reviewCount: number,
  masteryLevel: number
): Date {
  const now = new Date();

  if (masteryLevel === 0) {
    // 不会：重置为1天后
    return addDays(now, 1);
  }

  if (masteryLevel === 1) {
    // 模糊：缩短间隔
    const intervals = [1, 2, 3, 5, 10];
    return addDays(now, intervals[Math.min(reviewCount, 4)]);
  }

  // 掌握：标准艾宾浩斯曲线
  const intervals = [1, 2, 4, 7, 15, 30];
  return addDays(now, intervals[Math.min(reviewCount, 5)]);
}
```

### 4. 响应式布局

```tsx
// components/Layout.tsx
export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-green-500 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">WordSprint</h1>
          <div className="flex gap-4">
            <LearnerSelector />
            <WordbookSelector />
          </div>
        </div>
      </header>

      {/* Tab导航 - 移动端底部，PC端顶部 */}
      <nav className="md:flex md:border-b border-gray-200 bg-white">
        <TabNavigation />
      </nav>

      {/* 主内容区 */}
      <main className="container mx-auto p-4 pb-20 md:pb-4">
        {children}
      </main>

      {/* 移动端底部导航 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t">
        <BottomTabNavigation />
      </nav>
    </div>
  );
}
```

### 5. 数据库迁移

使用 Prisma 管理数据库 schema:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"  // 或 "postgresql"
  url      = env("DATABASE_URL")
}

model Learner {
  id        Int      @id @default(autoincrement())
  name      String
  avatar    String?
  words     Word[]
  records   LearningRecord[]
  schedules ReviewSchedule[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Wordbook {
  id          Int      @id @default(autoincrement())
  name        String
  type        String
  category    String?
  description String?
  isBuiltin   Boolean  @default(false)
  words       Word[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ... 其他模型
```

---

## 部署方案

### Docker 部署

**Dockerfile**:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

ENV DATABASE_URL="file:/data/wordsprint.db"

CMD ["npm", "start"]
```

**docker-compose.yml**:

```yaml
version: '3.8'

services:
  wordsprint:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/data
    environment:
      - DATABASE_URL=file:/data/wordsprint.db
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: unless-stopped
```

**一键启动**:
```bash
docker-compose up -d
```

访问: `http://localhost:3000`

### 环境变量配置

创建 `.env` 文件:

```env
# 数据库
DATABASE_URL="file:./data/wordsprint.db"

# OpenAI API（可选，用于LLM功能）
OPENAI_API_KEY="sk-..."

# 百度OCR API（可选，拍照识别降级方案）
BAIDU_OCR_API_KEY="..."
BAIDU_OCR_SECRET_KEY="..."

# 部署模式
NODE_ENV="production"
```

---

## 验证方案

### 功能验证

**1. 单词录入验证**:
- [ ] 手动输入单词，能自动查询到释义、音标、例句
- [ ] 拍照识别能成功识别书本上的单词
- [ ] 语音输入能准确识别说出的单词

**2. 学习功能验证**:
- [ ] 卡片模式能正常翻转，显示完整信息
- [ ] 发音功能能正常播放单词读音
- [ ] 标记掌握程度后，复习计划自动更新

**3. 测验功能验证**:
- [ ] 4种题型都能正常展示和作答
- [ ] 答题后能看到正确反馈
- [ ] 测验完成后能看到成绩统计

**4. 统计功能验证**:
- [ ] 基础统计数据准确
- [ ] 学习曲线图表能正确显示
- [ ] 学习日历能正确标记有学习的日期

**5. 多设备同步验证**:
- [ ] 在设备A添加单词，设备B刷新页面后能看到
- [ ] 在设备A学习后，设备B的统计数据正确更新

### 性能验证

- [ ] 页面首屏加载时间 < 2秒
- [ ] 词库切换响应时间 < 500ms
- [ ] 单词查询API响应时间 < 3秒
- [ ] 数据库查询优化（添加索引）

### 兼容性验证

- [ ] Chrome/Edge 最新版本
- [ ] Safari iOS 14+
- [ ] 微信内置浏览器
- [ ] PC端响应式布局正常
- [ ] 移动端响应式布局正常

---

## 后续扩展（Future Work）

### Phase 2 功能（可选）

1. **iOS App**: 使用 React Native 或 Flutter 封装原生App
2. **微信小程序**: 使用 Taro/uni-app 编译小程序版本
3. **离线模式**: PWA支持，离线时可使用基础功能
4. **语音评分**: 用户跟读单词，AI评分发音准确度
5. **单词游戏**: 连连看、拼图等游戏化学习方式
6. **学习小组**: 多人PK、排行榜等社交功能
7. **家长管理端**: 独立的家长监督界面，设置学习目标

### 技术优化

1. 图片压缩和CDN加速
2. 数据库分表优化（学习记录表数据量大时）
3. Redis缓存热门词库数据
4. API限流和防刷
5. 用户行为分析和埋点

---

## 总结

WordSprint 是一款专为儿童设计的英语单词学习应用，核心优势在于：

1. **录入便捷**: 手动、拍照、语音三种方式覆盖各种场景
2. **学习科学**: 艾宾浩斯复习曲线 + 多种测验题型
3. **界面友好**: 色彩明快、图标可爱，适合小孩使用
4. **部署简单**: Docker 一键部署，支持本地和云端
5. **多端同步**: 响应式设计，PC和手机浏览器都能用

技术选型使用 Next.js 全栈框架，既保证了开发效率，又确保了部署的简便性。AI能力集成（LLM、OCR、语音识别）为用户提供了智能化的学习体验。

通过本设计文档，开发团队可以清晰地理解系统架构、数据模型、功能模块和实现细节，为后续的开发工作奠定坚实基础。
