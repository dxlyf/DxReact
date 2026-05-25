这四个概念通常出现在大模型应用开发框架中（如 LangChain、Semantic Kernel、AutoGPT 等），它们的定位和使用方式各有侧重。下面分别说明如何用以及适合处理什么任务。

---

## 1. Chat（对话式交互）
**使用方式**  
直接通过聊天界面或 API 进行多轮对话，每次输入问题，模型直接输出回答。不涉及工具调用或自主规划。

**适合任务**  
- 日常咨询（天气、新闻、百科）  
- 简单代码答疑或解释  
- 创意写作、头脑风暴  
- 文档内容总结  
- 客服场景中的基础问答  

**特点**：快速、直接、低成本，但无法主动执行外部操作。

---

## 2. Agent（智能体）
**使用方式**  
定义一个 Agent，给它一组可调用的工具（搜索、计算器、API、数据库等）和系统指令。Agent 会自行思考、规划步骤、调用工具、并最终输出答案。通常采用 ReAct、Plan-and-Execute 等模式。

**适合任务**  
- 需要多步推理的问题（比如：对比两款产品的销量并生成报告）  
- 需要调用外部服务（发送邮件、查询订单、抓取网页）  
- 自动化任务执行（如自动整理文件夹、定时提醒）  
- 研究与数据收集（搜索 → 分析 → 汇总）  

**特点**：自主性强、能完成复杂流程，但可能产生额外 token 消耗和运行时间。

---

## 3. Skills（技能）
**使用方式**  
先定义或加载一个个独立的“技能模块”，每个技能是一个函数或提示词模板，专门解决某一类任务（例如 `MathSkill` 做精确计算，`FileSkill` 做文件读写）。在主流程（Agent 或 Chat 中）按需调用这些技能。

**适合任务**  
- 需要稳定执行的特定功能（如单位换算、发送 HTTP 请求）  
- 将大模型与确定性代码混合（先用模型判断意图，再调用技能）  
- 构建可复用的能力库（多个 Agent 共享同一套技能）  

**特点**：模块化、可复用、结果可靠，但需要预先开发和注册技能。

---

## 4. Solo Agent（独立智能体）
**使用方式**  
一种特殊的 Agent 形态——系统只运行**一个** Agent，所有任务都由它独自完成，不与其他 Agent 协作或竞争。配置时通常关闭多代理通信机制，给予全面的工具和内存。

**适合任务**  
- 个人虚拟助理（管理日历、整理笔记、发邮件）  
- 自动化的编程助手（阅读代码 → 修改 → 跑测试）  
- 需要长期保持一致身份和记忆的任务（如陪你练口语的角色）  
- 资源受限或不需要分工的场景  

**特点**：状态单一、易于调试、不会出现多 Agent 之间的冲突，但无法并行处理多种类型任务。

---

## 快速对比表

| 概念       | 是否调用工具 | 是否自主规划 | 典型任务复杂度 | 适用场景举例           |
|------------|--------------|--------------|----------------|------------------------|
| Chat       | 否           | 否           | 低              | 闲聊、简单问答         |
| Agent      | 是           | 是           | 高              | 研究、多步操作         |
| Skills     | 是（内建）   | 否（被动调用）| 中              | 精确计算、文件操作     |
| Solo Agent | 是           | 是           | 中高            | 个人助理、单一专属助手 |

实际项目中常将它们组合使用：**Chat** 是交互界面，**Skills** 是能力库，**Agent** 或 **Solo Agent** 是控制大脑。你可以根据任务的工具依赖程度和规划需求，选择合适的模式。

创建一个Skill（技能），核心就是为AI提供一份清晰、可靠的“说明书”，让它知道什么情况下该做什么事，以及如何一步步完成。一般有两种主流的创建方式：一种是更易上手的“声明式”（SKILL.md），另一种是更强大的“代码式”（LangChain工具）。

### 📄 方式一：声明式技能 (SKILL.md)

这是目前最通用、门槛也最低的方式。你主要用一个名为 `SKILL.md` 的Markdown文档来描述整个技能的逻辑，非常适合内容生成、工作流定义等非代码任务。

*   **创建结构**：为一个技能创建一个专属文件夹，例如 `my-pdf-processor/`，里面只需包含一个`SKILL.md`核心文件。
*   **填写`SKILL.md`内容**：文件分为头部元数据（YAML格式）和正文（Markdown格式）两大部分。

```yaml
---
# 头部元数据 (YAML格式)
name: pdf-data-extractor   # 必填，技能唯一标识，如 'create-pdf'
description: 从PDF文件中提取文本、表格和元数据。当用户需要处理PDF文档时使用此技能。
version: 1.0.0              # 技能版本号
author: Your Name           # 可选，作者信息
license: MIT                # 可选，开源协议，如 MIT, Apache-2.0
tags: ["pdf", "data-extraction", "document-processing"] # 可选，用于分类
---

# PDF Data Extractor Skill
## When to use this skill
当用户明确要求**处理 PDF 文件**时使用此技能，典型触发词包括：“提取PDF中的表格”、“总结这个PDF”、“把这个PDF转成Word”等。

## How it works
1.  **输入验证**：确认用户提供了PDF文件路径，并检查文件是否存在。若文件不存在，提示用户重新提供。
2.  **提取核心数据**：
    *   **文本**：使用 `pypdf` 或 `pdfplumber` 库读取所有文本内容。
    *   **表格**：识别并提取PDF中的表格，将其转换为易于阅读的Markdown格式。
    *   **元数据**：获取作者、创建日期等信息。
3.  **结果整合**：将提取的文本、表格和元数据清晰地组织起来返回给用户。

## Examples
**用户**: “帮我总结一下这个PDF文档的主要观点：/path/to/report.pdf”
**处理流程**:
  1. 首先，调用脚本验证文件 `/path/to/report.pdf` 是否存在。
  2. 然后，调用脚本读取其全部内容。
  3. 最后，由AI进行总结并呈现。

## Error Handling
如果遇到文件不存在、无法解析或内容为空的情况，请明确告知用户并请求修正。
```

为了更方便，你也可以使用现成的脚手架工具 `create-skills` 来快速搭建这个结构：
```bash
npx create-skills pdf-data-extractor --description "从PDF文件中提取文本和表格"
```

### 💻 方式二：代码式技能 (LangChain Tools)

当你需要AI执行确定性的代码，或者访问数据库、调用外部API等操作时，就需要编写实际的代码。

*   **核心方法**：在LangChain这类框架中，可以定义一个函数，然后用`Tool`包装，它会自动生成给AI看的`name`和`description`。

```python
import requests
from langchain.tools import Tool

def get_current_weather(city_name: str) -> str:
    """调用天气API并返回结果"""
    try:
        api_key = "YOUR_API_KEY"
        url = f"https://api.weatherapi.com/v1/current.json?key={api_key}&q={city_name}"
        response = requests.get(url)
        data = response.json()
        return f"{city_name}当前是{data['current']['condition']['text']}，{data['current']['temp_c']}°C"
    except Exception as e:
        return f"抱歉，查询{city_name}天气时出错了：{str(e)}"

# 将函数包装成 LangChain 可用的 Tool
weather_tool = Tool(
    name="WeatherQuery",
    func=get_current_weather,
    description="用于查询指定城市的实时天气信息，输入城市名称（中文或英文）即可。"
)
```
*   **更好用的跨平台方案**：可以试试开源的 `ai-skills-sdk`，它定义了一种统一的 `skill.yaml` 文件格式，写完一次就能一键导出适配各种框架。

```yaml
# 在 ai-skills-sdk 的 skill.yaml 中定义输入输出和执行方式
skill:
  id: my-weather-skill
  version: 1.0.0
  name: 天气查询
  description: 查询指定城市的实时天气信息
  inputs:
    - name: city
      type: string
      required: true
      description: 城市名称，如 'Beijing'
  outputs:
    - name: result
      type: string
  execution:
    type: prompt
    prompt_template: |
      你是一个天气助手。请使用以下格式查询{city}的天气：
      1. 首先，调用 `get_weather` 函数，参数为 `city`。
      2. 然后，用友好的语气组织结果返回。
```

创建好之后，你可以用各种工具进行本地验证。例如，使用 `skills-ref` 检查声明式技能的格式：
```bash
skills-ref validate ./my-skill
```
或者用 `aiskills` 运行代码式技能，观察效果：
```bash
aiskills run skill.yaml --input '{"city": "Shanghai"}' --execute
```

### ✨ 填写技能信息的最佳实践

为了让AI能准确调用你的技能，填写信息时可以参考下面几个要点：

1.  **善用YAML前置元数据**：在`SKILL.md`中，必须包含`name`和`description`。`description`要写得具体、可操作，AI会根据它来判断何时调用技能。
2.  **模拟AI的判断逻辑**：将`description`写成一条“如果...那么...”的指令，引导AI理解。比如："**当用户询问某个城市的天气时**，使用这个技能来获取实时数据"。
3.  **巧用Markdown结构化正文**：用标题和列表把操作的**步骤、参数、示例**都写清楚，内容越具体，AI的执行就越准确。
4.  **善用触发词和示例**：在Markdown正文中清晰列出技能的触发词和场景示例（比如“用户说了‘总结PDF’时”），能帮助AI更精准地完成任务。
5.  **拥抱视觉化工具**：如果你用的是`AutoGPT`这类平台，可以直接在其图形界面中拖拽功能块来可视化地创建技能，它能自动完成后续的部署和执行流程。

你的理解非常准确。这正是 `skill` 与 `agent` 的核心区别：

- **Skill 是能力单元**：它只负责**如何做**某一件具体的事（例如“计算两个日期的差值”、“把 PDF 转成图片”、“发送 HTTP 请求”）。Skill 没有身份、没有记忆、不会主动决策，就像工具箱里的一把扳手。
- **Agent 是角色/大脑**：它拥有一个**角色设定**（例如“你是一位专业的财务分析师”）、记忆、规划能力，并会**决策**在什么时候、调用哪一个或哪几个 Skill 来完成一个更大的目标。

换一种更形象的类比：

| 维度 | Skill | Agent |
|------|-------|-------|
| 本质 | 函数 / 工具 | 一个带有上下文和目标的执行者 |
| 是否有身份/角色 | 无 | 有（如客服、翻译官、编程助手） |
| 是否有长期记忆 | 无 | 有（对话历史、向量存储等） |
| 是否能主动规划 | 否（被动调用） | 是（自行拆解任务、选择 Skill） |
| 是否拥有对话能力 | 否 | 通常是（面向用户交互） |

**实际使用中的例子**：

- 你会创建一个 `SendEmail` Skill，它只做一件事：接收收件人、主题、正文 → 调用邮件 API 发送。
- 你还会创建一个 `CustomerSupport` Agent，它的角色设定是“耐心、专业的售后客服”，记忆用户的历史订单，并且当用户说“我想退换货”时，Agent 自己决定：先调用 `OrderLookup` Skill 查订单，再调用 `ReturnPolicyCheck` Skill 确认是否可退，最后再调用 `SendEmail` Skill 通知用户。

所以，你的总结完全正确：**Skill 是“能力”，Agent 是“角色”。** 一个 Agent 可以拥有多个 Skills，就像一个人可以会开车、会做饭、会写代码一样——但 Skills 本身并不取代 Agent 的身份。