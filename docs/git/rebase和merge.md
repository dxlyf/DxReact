好的，我们继续深入。既然你已经掌握了 Git 常用命令的全貌，下一步很自然就是：**那些容易混淆的命令，到底该用哪个？**

在大厂的实际开发中，选错命令轻则污染提交历史，重则丢失代码。下面我把几组最关键的"命令对比"讲透。

---

## 🔥 第一组：`merge` vs `rebase`（最常见的灵魂拷问）

### 核心区别

| | **Merge** | **Rebase** |
|---|---|---|
| **历史记录** | 保留真实的时间线和分支结构，会产生一个"合并提交" | 线性历史，看起来像一条直线，没有分叉 |
| **安全性** | 非常安全，任何时候都不会改写历史 | 会改写提交历史，**绝不能对公共分支使用** |
| **冲突解决** | 一次 merge 解决一次冲突 | 每个提交可能都要解决冲突（多次） |
| **适用场景** | 合并 feature 分支到 master / 公共分支 | 在本地整理自己的提交，让历史更干净 |

### 图示对比

**Merge 的结果：**
```
      A---B---C feature
     /         \
D---E---F---G---H master
```

**Rebase 的结果：**
```
                  A'--B'--C' feature (新提交)
                 /
D---E---F---G---H master
```

### 大厂实际用法

```bash
# ✅ 正确做法
# 1. 在自己的 feature 分支上，用 rebase 保持与 master 同步
git checkout feature/user-login
git rebase master   # 把 master 的新提交"垫"到你的修改下面

# 2. 合并到 master 时，用 merge（保留历史）
git checkout master
git merge --no-ff feature/user-login   # --no-ff 强制产生合并提交
```

### ❌ 绝对禁止的操作

```bash
# 千万不要对公共分支执行 rebase！
git checkout master
git rebase feature   # 这会导致所有同事的历史被改写，后果严重
```

**一句话总结：本地用 rebase 整理，公共分支用 merge。**

---

## 🔥 第二组：`reset` vs `revert`（撤销提交的正确姿势）

### 核心区别

| | **Reset** | **Revert** |
|---|---|---|
| **本质** | 移动 HEAD 指针，**删除**历史 | 创建一个**新的提交**来反向操作，保留历史 |
| **历史记录** | 改写历史（提交会被抹去） | 追加历史（原来的提交还在） |
| **是否可推送** | 只能用于**尚未推送**的提交 | 可以用于**已推送**的提交 |
| **冲突风险** | 无，因为是本地操作 | 可能有冲突，需要解决 |

### 场景举例

假设你有三个提交：`A <- B <- C`（HEAD 在 C）

```bash
# 想撤销 C，回到 B
git reset --soft HEAD~1   # 撤销 C，但修改保留在暂存区
git reset --mixed HEAD~1  # 撤销 C，修改保留在工作区（默认）
git reset --hard HEAD~1   # 完全删除 C，代码也没了（⚠️危险）
```

```bash
# 想撤销 C，但保留历史（C 已经推送到远程）
git revert HEAD           # 创建一个新提交 D，内容是把 C 的改动回退
# 结果：A <- B <- C <- D（D 和 B 的代码相同）
```

### 大厂实际用法

```bash
# ✅ 还没 push：用 reset
git reset --soft HEAD~1   # 撤销最后一次提交，但代码保留
git commit -m "重新提交正确的信息"

# ✅ 已经 push：用 revert
git revert HEAD
git push origin master    # 安全推送，其他人不受影响

# ❌ 已经 push 了还用 reset --hard + force push
git reset --hard HEAD~1
git push --force          # 这会导致同事的代码被覆盖，同事会恨你
```

**一句话总结：本地撤销用 reset，公共撤销用 revert。**

---

## 🔥 第三组：`git pull` vs `git pull --rebase` vs `git fetch`

### 核心区别

| | **git pull** | **git pull --rebase** | **git fetch** |
|---|---|---|---|
| **做了什么** | `fetch` + `merge` | `fetch` + `rebase` | 只下载，不合并 |
| **历史结果** | 可能产生一个 merge 提交 | 线性历史，无分叉 | 什么都不改变 |
| **什么时候用** | 团队习惯用 merge 方式 | 想要干净的历史 | 想先看看远程改了啥 |

### 图示说明

**`git pull` 的结果（默认）：**
```
      D---E  (远程更新)
     /
A---B---C  (本地)
```
执行后可能产生一个合并提交 F。

**`git pull --rebase` 的结果：**
```
A---B---D---E---C'  (本地提交 C 被"挪"到最后面)
```

### 大厂实际用法

```bash
# ✅ 推荐：用 rebase 方式拉取（保持线性历史）
git pull --rebase origin master

# ✅ 如果已经产生了冲突，解决后继续
git add .
git rebase --continue

# ✅ 想放弃 rebase，回到拉取前的状态
git rebase --abort

# ✅ 只查看远程更新，不合并
git fetch origin
git log origin/master   # 看看远程有什么新提交
git diff origin/master  # 看看差异
```

### 配置默认使用 --rebase

```bash
# 全局配置，以后所有 git pull 都自动用 rebase
git config --global pull.rebase true

# 或者只针对当前仓库
git config pull.rebase true
```

**一句话总结：`git pull --rebase` 是最佳实践，`git fetch` 用于"只看不拉"。**

---

## 🔥 第四组：`git reset` 的三种模式

这是新手最晕的地方，其实搞清楚"三个区域"就明白了。

### 三个区域回顾

| 区域 | 说明 |
|---|---|
| **工作区** | 你正在编辑的代码文件 |
| **暂存区** | `git add` 之后的地方 |
| **本地仓库** | `git commit` 之后的地方 |

### 三种 reset 模式

假设当前状态：提交历史有 `A <- B <- C`，HEAD 在 C。暂存区和工作区都有一些修改。

```bash
# --soft：只动 HEAD，不动暂存区和工作区
git reset --soft HEAD~1
# 结果：HEAD 指向 B，但暂存区和工作区都还是 C 的内容
# 相当于"撤销了 commit，但保留了 add"

# --mixed：动 HEAD + 清空暂存区（默认行为）
git reset --mixed HEAD~1
# 结果：HEAD 指向 B，暂存区被清空，工作区还是 C 的内容
# 相当于"撤销了 commit 和 add，修改还在工作区"

# --hard：全清空（最危险）
git reset --hard HEAD~1
# 结果：HEAD 指向 B，暂存区和工作区都变成 B 的内容
# C 的修改全部丢失（除非用 reflog 找回来）
```

### 实际场景

```bash
# 场景1：commit 信息写错了，想重写
git commit -m "错误的信息"
git commit --amend -m "正确的信息"   # 等价于 reset + commit

# 场景2：add 多了文件，想撤出暂存区
git add .                    # 不小心把所有文件都 add 了
git reset HEAD unwanted.txt  # 只撤出 unwanted.txt

# 场景3：想放弃所有本地修改，回到最新提交的状态
git reset --hard HEAD        # 慎用！
git clean -fd                # 还要删除未跟踪的文件
```

---

## 🔥 第五组：`git stash` 相关（临时切分支必备）

### 常用操作速查

```bash
# 临时保存当前工作
git stash                    # 默认 save
git stash save "正在改登录功能" # 带说明

# 查看储藏列表
git stash list
# stash@{0}: On feature: 正在改登录功能
# stash@{1}: WIP on master: 3a6b2c1 修复bug

# 恢复储藏
git stash pop                # 恢复最近并删除记录
git stash apply stash@{1}    # 恢复指定的，保留记录

# 查看储藏内容
git stash show -p stash@{0}  # 查看具体改了哪些代码

# 清理储藏
git stash drop stash@{0}     # 删除指定
git stash clear              # 清空所有
```

### 大厂最佳实践

```bash
# ✅ 切分支前必做：stash 未提交的修改
git stash
git checkout master
git pull --rebase
git checkout feature/bugfix
git stash pop

# ✅ 更优雅的方式：使用 --autostash（Git 2.0+）
git pull --rebase --autostash   # 自动 stash 和 pop

# ✅ 如果想保留未跟踪的文件
git stash -u                    # 包括未跟踪的文件
git stash -a                    # 包括所有文件（包括 ignored）
```

---

## 📋 快速决策表

当你不知道用哪个命令时，看这张表：

| 你的需求 | 推荐命令 |
|---|---|
| 想合并分支，不关心历史分叉 | `git merge` |
| 想线性历史，自己在本地整理 | `git rebase` |
| 想撤销**还没 push** 的提交 | `git reset --soft HEAD~1` |
| 想撤销**已经 push** 的提交 | `git revert HEAD` |
| 想拉取远程更新 | `git pull --rebase` |
| 只想看看远程改了啥，不合并 | `git fetch` |
| 正在改代码，需要紧急切分支 | `git stash` + `git checkout` |
| 想改最近一次 commit 的信息 | `git commit --amend` |
| 不小心 add 了多余的文件 | `git reset HEAD <file>` |
| 想放弃工作区的修改 | `git restore <file>` |
| 代码丢了，想找回来 | `git reflog` + `git reset` |

---

## 🧪 进阶建议：把 Git 用出花

大厂资深工程师会掌握这些技巧：

### 1. 交互式 rebase（整理提交历史）

```bash
# 合并最近 3 个提交为一个
git rebase -i HEAD~3

# 在编辑器中：
# pick a1b2c3 第一个提交
# squash d4e5f6 第二个提交（合并到上一个）
# squash g7h8i9 第三个提交（合并到上一个）
# 保存后重新写提交信息
```

### 2. Cherry-pick（选择性合并）

```bash
# 只把 feature 分支上的某个特定提交合并到 master
git checkout master
git cherry-pick a1b2c3d   # 只拿这一个提交
```

### 3. Bisect（二分查找 bug）

```bash
# 开始二分查找
git bisect start
git bisect bad HEAD       # 当前版本有问题
git bisect good v1.0.0    # v1.0.0 是好的

# Git 会自动切到中间提交，你测试后标记
git bisect good           # 这个版本是好的
git bisect bad            # 这个版本是坏的
# 重复几次后，Git 会定位到引入 bug 的那个提交
```

### 4. Reflog（后悔药）

```bash
# 找回被 reset --hard 删除的提交
git reflog                # 找到那个提交的哈希值，比如 a1b2c3d
git checkout a1b2c3d      # 切过去看看
git branch recover-branch a1b2c3d  # 创建一个分支保住它
```

---

如果你已经看到了这里，说明你对 Git 的理解已经超越了绝大多数开发者。接下来建议你：

1. **把 `git config --global alias` 配置好**，把常用命令变成缩写
2. **在个人项目中刻意练习 `rebase -i` 和 `cherry-pick`**
3. **下一次遇到 merge 冲突时，尝试用 `git mergetool` 可视化解决**

如果你还想深入了解某个具体场景（比如"多人协作时 rebase 冲突怎么解决"或者"如何优雅地管理多版本发布"），随时告诉我，我可以继续展开。