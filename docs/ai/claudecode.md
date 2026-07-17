Claude Code 是一个能在终端中帮你编码的 AI 助手，安装和上手流程很直接。

### 📦 安装 Claude Code

官方提供了几种安装方式，推荐使用**原生安装（Native Install）**，它会自动在后台保持更新。

1.  **打开终端**，根据你的系统选择以下命令并运行：
    *   **macOS / Linux / WSL**：
        ```bash
        curl -fsSL https://claude.ai/install.sh | bash
        ```
    *   **Windows (PowerShell)**：
        ```powershell
        irm https://claude.ai/install.ps1 | iex
        ```
    *   **Windows (CMD)**：
        ```cmd
        curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
        ```
    如果你更习惯用包管理工具，也可以通过 **Homebrew** 或 **npm (Node.js 18+)** 安装：
    ```bash
    brew install --cask claude-code
    npm install -g @anthropic-ai/claude-code
    ```

2.  **验证安装**：在终端中输入以下命令，如果成功输出版本号，就说明安装好了：
    ```bash
    claude --version
    ```

### 🚀 初次使用与登录

1.  **进入项目并启动**：cd 到你的项目目录，然后输入 `claude` 命令：
    ```bash
    cd /path/to/your/project
    claude
    ```

2.  **登录账户**：首次运行会引导你在浏览器中登录。你需要有一个**Claude Pro、Max、Team 或 Enterprise 订阅**，或者一个 **Anthropic Console 账户**。免费的 Claude.ai 账户无法使用 Claude Code。

### 💡 快速上手小技巧

*   **首次探索**：在 Claude Code 的交互界面中，可以试试问它：
    *   `Give me a 5-bullet summary of what this codebase does and where the entry point is.`（了解项目概况）
    *   `Where is user authentication handled?`（查找特定功能位置）
*   **执行一个安全编辑**：让它帮你做个小修改，熟悉一下它提交更改的方式：
    > Add a docstring to the main function in src/utils.js. Keep it to 2 lines.

*   **让项目更懂你**：在项目根目录运行 `/init` 命令，Claude Code 会生成一个 `CLAUDE.md` 文件，记录项目结构和约定。以后每次会话它都会读取这个文件，让它的回答更贴合你的项目。

### 🔧 重要说明与提示

*   **需要账户**：必须使用付费的 Claude 订阅或 Console 账户才能使用 CLI 版本。
*   **更喜欢图形界面？**：如果不习惯用终端，可以下载**Claude Code 桌面应用**（适用于 macOS、Windows、Linux），它提供了完整的图形界面，同样可以完成所有操作。
*   **两种安装路径是独立的**：终端里装的 CLI 和上面提到的桌面应用是分开的，安装时需要注意。
*   **权限模式**：默认情况下，Claude Code 修改文件或运行命令前都会**征求你的同意**，很安全。你可以按 `Shift+Tab` 在“手动审批”、“自动接受编辑”等模式间切换。

如果你想了解更详细的命令、如何处理特定任务，或者遇到了安装问题，随时可以再问我～


目前市面上好用的终端UI库确实不少，而且各有千秋，选哪个主要看你的技术栈和具体需求。

我把当前（截至2026年7月）比较热门、各语言生态中具有代表性的库整理了一下，你可以参考看看：

### 🌟 主流TUI库快速对比

| 库 (Library) | 语言 / 技术栈 | 核心特点与定位 | 适合谁用 |
| :--- | :--- | :--- | :--- |
| **Ink** | JavaScript/Node.js | **React语法**，用组件方式构建UI，有**Flexbox布局**，社区庞大（35.6k Stars）。 | 如果你已经会React，想快速上手开发终端应用。知名项目如 **Claude Code** 和 **Gemini CLI** 都在用它。 |
| **Bubble Tea** | Go | **Elm架构**（Model-View-Update），提供了优雅的状态管理方式，生态丰富（40.7k Stars）。 | 如果你是Go开发者，或者喜欢函数式、声明式的UI开发模式。GitHub和GitLab的项目中有它的身影。 |
| **Textual** | Python | 功能极其强大，支持**CSS样式**，组件丰富（35+），甚至能渲染到**浏览器**中运行（34.9k Stars）。 | 如果你是Python开发者，需要构建一个复杂、美观、交互丰富的终端应用。 |
| **Ratatui** | Rust | Rust生态的王者（19.1k Stars），**性能强悍**，支持**即时模式**渲染，版本迭代活跃（v0.30.0是最重大更新）。 | 如果你追求极致的性能和内存安全，使用Rust开发对响应速度要求高的工具。 |
| **OpenTUI** | TypeScript + Zig | 新兴力量（9.4k Stars），它的**核心渲染引擎用Zig编写**，宣称渲染性能是传统方案的3-5倍。同时支持React、SolidJS、Vue。 | 如果你对性能有极致要求，又想用TypeScript和熟悉的框架开发。目前处于**pre-1.0阶段**，README中标注尚不适合生产环境。 |
| **Melker** | TypeScript/Deno+Node | 新范式探索者，特点鲜明：**无构建步骤**，支持类似HTML的标记文件和**Flexbox布局**，内置国际化(i18n)方案。 | 如果你想尝试一种全新的、更接近Web开发的TUI构建方式，且需要快速原型验证。 |
| **TamboUI** | Java | 专为Java生态打造的现代化TUI库，受Ratatui启发，提供从底层到高层API，**兼容GraalVM**可编译为原生镜像。 | 如果你是Java开发者（特别是使用Maven/Spring的团队），想用熟悉的工具链构建TUI。 |
| **Cursive** | Rust | 一个**简单易用**的Rust TUI库，适合**快速开发**复杂界面，内置按钮、输入框等多种组件。 | 需要快速开发一个交互式原型，或者希望学习曲线更平缓的Rust开发者。 |

### 💡 怎么选？

*   **看你的主力语言**：这是最直接的筛选条件。TypeScript/Node.js 首选 **Ink** 或 **OpenTUI**；Python 必看 **Textual**；Go 语言就认准 **Bubble Tea**；Rust 生态则在 **Ratatui** 和 **Cursive** 之间根据需求权衡。

*   **看你的熟悉范式**：如果你熟悉 **React**，**Ink** 和 **OpenTUI** 会让你得心应手；如果喜欢 Elm 架构的清晰状态管理，**Bubble Tea** 会给你非常舒适的体验；如果你对 CSS 布局得心应手，**Textual** 的设计会让你感到亲切。

*   **看你的性能与体验要求**：对渲染帧率和资源占用有极致要求，可以考虑 **Ratatui** (Rust) 和 **OpenTUI** (Zig渲染)；如果需要给应用加上美观的样式和流畅的动画，**Textual**、**Bubble Tea** 和 **Ink** 都支持得很好。

这些库基本覆盖了主流语言和场景。如果你能告诉我你主要用什么编程语言，以及大概想做个什么类型的终端工具，我可以帮你挑一个最顺手的～