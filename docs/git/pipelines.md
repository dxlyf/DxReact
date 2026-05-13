`git push -o ci.skip` 是一个非常实用的**大厂进阶技巧**，它的作用是：

**在推送代码时，告诉 CI/CD 系统（如 GitLab CI、GitHub Actions、Jenkins 等）跳过本次推流触发的自动化流水线。**

---

## 🎯 核心作用

| 场景 | 正常情况 | 使用 `-o ci.skip` |
|---|---|---|
| 推送代码到远程 | 自动触发测试、构建、部署等 CI 任务 | **完全跳过** CI 流程 |
| 执行时间 | 可能耗时几分钟到几十分钟 | 几乎瞬时完成 |
| 适用情况 | 正式的功能提交、Bug 修复 | 文档修改、注释调整、实验性提交 |

---

## 📝 语法详解

```bash
# 基本语法
git push -o ci.skip

# 更完整的示例
git push origin feature/branch -o ci.skip

# 也可以同时指定多个选项
git push origin feature/branch -o ci.skip -o merge_request.create
```

### 参数说明

| 参数 | 含义 |
| :--- | :--- |
| `-o` | `--push-option` 的缩写，用于传递推送选项 |
| `ci.skip` | GitLab 等平台支持的特定选项，表示跳过 CI |

---

## 🏢 大厂实际应用场景

### 1️⃣ 修改文档或注释

```bash
# 改了 README.md 或代码注释，完全不需要跑测试
git add README.md
git commit -m "docs: 更新安装说明"
git push -o ci.skip
```

### 2️⃣ 修复格式问题（Lint）

```bash
# 修复代码格式后，不需要重新跑单元测试
git add --all
git commit -m "style: 修复缩进和空格"
git push -o ci.skip
```

### 3️⃣ 实验性的临时提交

```bash
# 在 feature 分支上做实验，不想触发 CI
git add debug.log
git commit -m "temp: 添加调试日志"
git push -o ci.skip
```

### 4️⃣ 紧急跳过有问题的 CI

```bash
# 如果 CI 配置有 bug 导致一直失败，可以临时跳过
git push -o ci.skip
# 等修复 CI 配置后再正常推送
```

### 5️⃣ 批量推送多个分支

```bash
# 清理或同步多个分支时，不需要每个都触发 CI
for branch in old-feature1 old-feature2; do
    git push origin $branch -o ci.skip
done
```

---

## ⚙️ 各平台支持情况

| 平台 | 是否支持 | 语法 |
| :--- | :--- | :--- |
| **GitLab CI** | ✅ 原生支持 | `-o ci.skip` |
| **GitHub Actions** | ⚠️ 需要特殊处理 | 在 commit message 中包含 `[skip ci]` 或 `[ci skip]` |
| **Bitbucket Pipelines** | ✅ 支持 | commit message 中包含 `[skip ci]` |
| **Jenkins** | ⚠️ 取决于配置 | 需要配置插件或使用 commit message 关键字 |
| **Azure DevOps** | ✅ 支持 | commit message 中包含 `***NO_CI***` |

### GitHub Actions 的替代写法

```bash
# GitHub 不支持 -o ci.skip，需要在 commit message 中标记
git commit -m "更新文档 [skip ci]"
git push

# 其他支持的标记
git commit -m "修复格式 [ci skip]"
git commit -m "临时提交 [skip actions]"
```

---

## ⚠️ 注意事项与风险

### ❌ 不要滥用

```bash
# 🚫 危险：跳过测试直接推送功能代码
git commit -m "feat: 支付功能"
git push -o ci.skip  # 测试没跑，可能把 bug 推到生产环境
```

### ✅ 合理使用原则

| 场景 | 是否使用 | 理由 |
| :--- | :--- | :--- |
| 修改文档/注释 | ✅ 可以 | 不影响代码逻辑 |
| 格式化代码 | ✅ 可以 | 功能没变 |
| 添加新功能 | ❌ 不应该 | 需要验证功能正确性 |
| 修复 Bug | ❌ 不应该 | 需要验证修复有效 |
| 重构代码 | ❌ 不应该 | 需要确保没有引入回归 |
| 修改 CI 配置 | ⚠️ 谨慎 | 改了 CI 本身，跳过 CI 有风险 |

---

## 🔧 更高级的推送选项

Git 的 `-o` 选项还可以传递更多信息：

```bash
# GitLab: 推送时同时创建 Merge Request
git push -o merge_request.create -o merge_request.target=main

# GitLab: 设置 MR 的标题和描述
git push -o merge_request.title="修复登录bug" -o merge_request.description="详见...-"

# GitHub: 跳过 Actions（通过 commit message）
git commit -m "更新文档 [skip ci]"

# 多个选项可以组合
git push -o ci.skip -o merge_request.create
```

---

## 📊 对比总结

| 方式 | 语法 | 适用平台 | 灵活性 |
| :--- | :--- | :--- | :--- |
| `-o ci.skip` | `git push -o ci.skip` | GitLab 原生 | 高，可以动态决定 |
| commit 关键字 | `git commit -m "... [skip ci]"` | GitHub、GitLab、Bitbucket | 中，需要提前写入 commit |
| 环境变量 | `CI_SKIP=true git push` | 部分平台 | 低，依赖 shell 环境 |
| Web 界面手动取消 | 登录网页点击取消 | 所有平台 | 低，需要手动操作 |

---

## 🎓 大厂最佳实践

在成熟的开发流程中，通常会这样规范使用：

```bash
# 1. 创建别名简化操作
git config --global alias.push-skip "push -o ci.skip"

# 使用
git push-skip

# 2. 配置 pre-push hook 提醒
# .git/hooks/pre-push
#!/bin/bash
if [[ "$1" == *"ci.skip"* ]]; then
    echo "⚠️  警告：跳过 CI，请确认这不是正式功能提交"
fi

# 3. CI 配置中排除特定路径
# .gitlab-ci.yml
workflow:
  rules:
    - if: '$CI_COMMIT_MESSAGE =~ /\[skip ci\]/'
      when: never
    - when: always
```

---

## 💡 总结

`git push -o ci.skip` 的核心价值是**提高开发效率**，让那些不需要验证的修改快速通过，避免浪费 CI 资源和等待时间。

**记住黄金法则：**
> 只在不影响代码逻辑的提交时使用（文档、注释、格式），**永远不要用它来绕过必要的测试**。

如果你还想了解 CI/CD 流程的完整设计（比如如何配置 `.gitlab-ci.yml` 或 GitHub Actions），或者想知道更多 Git 推送选项的用法，随时告诉我！


在 `git merge` 过程中，如果遇到冲突或需要编辑合并信息，通常会打开一个文本编辑器（默认可能是 **Vim**、**Nano** 或 **VS Code** 等）。以下是常见编辑器的退出方法：

## 最常见的情况：Vim 编辑器

如果界面底部显示 `~` 波浪号，没有任何提示文字，那就是 **Vim**：

```bash
# 方法1：保存并退出
:wq
# 然后按 Enter

# 方法2：强制保存并退出（如果只读文件）
:wq!
# 然后按 Enter

# 方法3：不保存退出（取消合并）
:q!

# 方法4：保存并退出（等效命令）
:x
```

**步骤**：
1. 按 `Esc` 键（确保退出输入模式）
2. 输入冒号 `:`
3. 输入 `wq` 或 `q!`
4. 按 `Enter`

## Nano 编辑器

如果底部显示文件操作命令（`^X Exit` 等）：

```bash
# 保存并退出
Ctrl + X   # 退出
Y          # 确认保存
Enter      # 确认文件名

# 不保存退出
Ctrl + X
N          # 不保存
```

## VS Code 或其他图形编辑器

直接关闭编辑器窗口或点击保存按钮。

## 查看当前编辑器类型

```bash
# 查看 git 配置的默认编辑器
git config core.editor

# 查看全局编辑器
git config --global core.editor
```

## 预防措施：修改默认编辑器

如果不想进入 Vim，可以设置成更熟悉的编辑器：

```bash
# 设置为 Nano（简单）
git config --global core.editor "nano"

# 设置为 VS Code
git config --global core.editor "code --wait"

# 设置为 Sublime Text
git config --global core.editor "subl -n -w"
```

## 其他合并相关退出场景

```bash
# 如果合并信息已写好，只需保存并退出（Vim 中 :wq）
# 编辑器中可以修改合并提交信息，删掉冲突说明即可

# 如果不想进行这次合并：
git merge --abort  # 放弃合并，回到合并前状态
```

**最简单的办法**：如果看到 Vim，按 `Esc` 键，然后输入 `:wq` 再按 `Enter` 即可保存并退出。