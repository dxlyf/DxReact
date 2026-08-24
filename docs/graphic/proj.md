

# 目标与约定（坐标与裁剪约定）

* 摄像机使用右手坐标系，摄像机朝向为 −Z（即视点看向负 z 轴），常见于 OpenGL 风格。
* 我们希望把视锥（frustum）内的点从相机空间（camera/view space）变换到裁剪空间（clip space），然后做齐次除法得到 NDC（Normalized Device Coordinates）。
* 这里采用的 NDC 深度范围是 **[-1, +1]**（OpenGL 风格）。函数名 `perspectiveNO` 中的 `NO` 可理解为 NDC z 在 Negative..One（即 −1 到 +1）这种约定。
* 我们要构造一个 4×4 齐次矩阵 (M)，满足：
  \(\mathbf{p}*{clip} = M , \mathbf{p}*{camera}) ，随后 ( \mathbf{p}*{ndc} = \mathbf{p}*{clip} / w_{clip}\)。

设相机空间中的点为 ( (x, y, z, 1)^T )。

---

# 1) x、y 分量的推导（视场与相似三角形）

在透视投影中，x 和 y 在 NDC 上的表达应为与相机空间的 (x/z) 和 (y/z) 成比例（因为透视缩放按深度反比做）。常见做法定义一个尺度因子 (f) 来由垂直视场角（fovy）决定：

\[
f = \frac{1}{\tan(\mathrm{fovy}/2)}
\]



其中 (f) 是把相机空间上的 (y/z) 缩放到 NDC 空间的比例（在未除以 w 前相应的矩阵分量）。考虑宽高比 `aspect`，最终我们希望：

\[
x_{ndc} = \frac{f}{\mathrm{aspect}}\cdot\frac{x}{-z},\qquad
y_{ndc} = f\cdot\frac{y}{-z}.
\]

（注意相机空间里面向前方的点通常有负 z，将来会出现 -z 的符号；形式上我们保证最终 NDC 的符号与期望一致。）

为了在矩阵乘法 + 齐次除法下得到上式，我们可在矩阵中使：

* clip.x = \( \frac{f}{\mathrm{aspect}} \cdot x \)
* clip.y = \( f \cdot y \)
* clip.w = (-z) （把 (w) 设成 −z，齐次除法后就得到 \(x_{ndc} = (\frac{f}{\mathrm{aspect}} x)/(-z) = \frac{f}{\mathrm{aspect}} \frac{x}{-z}\)）

因此矩阵第一、第二行（或更清楚地写成矩阵元素）会包含 \(f/\mathrm{aspect}\) 与 (f)。

---

# 2) z 分量的推导（把 camera z 映射到 NDC 的 −1..+1）

我们希望把相机空间的深度 (z)（注意这里相机前方的点通常有 (z<0)）映射到 NDC 的 ([-1, +1])，且满足：

* 当相机空间 \(z = -\text{near}\) 时，\(z_{ndc} = -1\)
* 当 \(z = -\text{far}\) 时，\(z_{ndc} = +1\)

在齐次矩阵形式中，设 clip.z 为线性组合（对原始 (z) 和常数项）：

\[
\text{clip.z} = C z + D,
\]
并且我们已设 \(\text{clip.w} = -z\)。所以

\[
z_{ndc} = \frac{\text{clip.z}}{\text{clip.w}}
= \frac{C z + D}{-z}.
\]

把上面的两个边界条件代入：

1. \(z = -\text{near}\) 时：
   \[
   \frac{C(-\text{near}) + D}{-(-\text{near})} = -1
   \quad\Rightarrow\quad
   \frac{-C\cdot \text{near} + D}{\text{near}} = -1
   \]
   即 \(-C\cdot \text{near} + D = -\text{near}\). （等式 A）

2. \(z = -\text{far}\) 时：
   \[
   \frac{C(-\text{far}) + D}{-(-\text{far})} = +1
   \quad\Rightarrow\quad
   \frac{-C\cdot \text{far} + D}{\text{far}} = 1
   \]
   即 \(-C\cdot \text{far} + D = \text{far}\). （等式 B）

对 A、B 联立消去 (D)。把两式相减或直接解：

从 A： \(D = -\text{near} + C\cdot\text{near}\)
从 B： \(D = \text{far} + C\cdot\text{far}\)

令两者相等：

\[
-\text{near} + C\cdot\text{near} = \text{far} + C\cdot\text{far}
\]
\[
C(\text{near}-\text{far}) = \text{far} + \text{near}
\]
\[
\Rightarrow\quad C = \frac{\text{far}+\text{near}}{\text{near}-\text{far}}.
\]

再代回求 (D)（任取 A 或 B）：

\[
D = -\text{near} + C\cdot\text{near} = -\text{near} + \text{near}\frac{\text{far}+\text{near}}{\text{near}-\text{far}}
= \frac{2\cdot \text{far}\cdot \text{near}}{\text{near}-\text{far}}.
\]

所以 (C) 与 (D) 的最终解析形式为：

\[
C = \frac{\text{far}+\text{near}}{\text{near}-\text{far}},\qquad
D = \frac{2\cdot \text{far}\cdot \text{near}}{\text{near}-\text{far}}.
\]

这就是将相机空间 z 映射到 NDC ([-1,1]) 的线性齐次形式参数。

---

# 3) 无限远（`far = Infinity`）的极限

当 far → ∞，把上面 C、D 做极限：

* \(C = \dfrac{\text{far}+\text{near}}{\text{near}-\text{far}} \approx \dfrac{\text{far}}{-\text{far}} \to -1.\)
* \(D = \dfrac{2\cdot\text{far}\cdot\text{near}}{\text{near}-\text{far}} \approx \dfrac{2\cdot\text{far}\cdot\text{near}}{-\text{far}} \to -2\cdot\text{near}.\)

因此无限远时可用常数 \(C=-1,; D=-2\cdot \text{near}\)，这就是代码中 `else` 分支的来源。

---

# 4) 最终矩阵（数学表示）

把前三步的结果组合，标准的透视投影矩阵（按行表示的数学形式）是：

\[
M =
\begin{pmatrix}
\frac{f}{\text{aspect}} & 0 & 0 & 0 \
0 & f & 0 & 0 \
0 & 0 & C & D \
0 & 0 & -1 & 0
\end{pmatrix},
\]

其中
\[
f = \frac{1}{\tan(\mathrm{fovy}/2)},\quad
C = \frac{\text{far}+\text{near}}{\text{near}-\text{far}},\quad
D = \frac{2,\text{far},\text{near}}{\text{near}-\text{far}}.
\]

对无限远情形用 \(C=-1,, D=-2,\text{near}\)。

解释一下矩阵的作用：

* 上两行负责 x、y 的投影缩放（由视场与宽高比决定）。
* 第三行和第四行配合把相机空间 z 用线性分式（\affine / -z\）映射到 NDC z 的 −1..+1 并把原来的 z 放到 clip.w（因为 clip.w = −z），第四行的 −1 就是把原始 z 传入 w（以实现齐次除法得到透视效果）。
* 最终经过齐次除法 ( \(x_{clip}, y_{clip}, z_{clip}, w_{clip}) \mapsto (x_{clip}/w_{clip}, y_{clip}/w_{clip}, z_{clip}/w_{clip}\)) 得到 NDC 坐标。

---

# 5) 与你代码数组索引对应（gl-matrix / column-major 风格）

你给出的代码显然按常用的 column-major（一维数组）风格来写（与 gl-matrix 相同）。若把矩阵写成如下（行/列下标从 0 开始）：

\[
M =
\begin{bmatrix}
m_{00} & m_{01} & m_{02} & m_{03} \
m_{10} & m_{11} & m_{12} & m_{13} \
m_{20} & m_{21} & m_{22} & m_{23} \
m_{30} & m_{31} & m_{32} & m_{33}
\end{bmatrix},
\]

在 column-major 的扁平数组中索引是：

```
out[0]=m00, out[1]=m01, out[2]=m02, out[3]=m03,
out[4]=m10, out[5]=m11, out[6]=m12, out[7]=m13,
out[8]=m20, out[9]=m21, out[10]=m22, out[11]=m23,
out[12]=m30, out[13]=m31, out[14]=m32, out[15]=m33.
```

把我们得到的矩阵元素带入（只列非零项）：

* (m_{00} = f/\mathrm{aspect})  → `out[0] = f / aspect`
* (m_{11} = f)                → `out[5] = f`
* (m_{22} = C)                → `out[10] = C`
* (m_{23} = D)                → `out[11] = D`  ← 注意：在你的代码 `out[11] = -1`，这看起来是把 -1 放在 m23 的位置 —— 但实际标准矩阵中 -1 在 m32（第 4 行第 3 列）的位置。**（下面我整理清楚）**

为了消除混淆：上面数学矩阵的形式是按行写的（row-major 的可视表达）。但与典型实现（例如 gl-matrix）一致的扁平化常用写法是把最后一列/行对换。更直观且与代码对应的非零项常见写法（与 gl-matrix 相同）是：

```
out[0]  = f / aspect;  // m00
out[1]  = 0;
out[2]  = 0;
out[3]  = 0;

out[4]  = 0;
out[5]  = f;           // m11
out[6]  = 0;
out[7]  = 0;

out[8]  = 0;
out[9]  = 0;
out[10] = C;           // m22
out[11] = -1;          // m23  (this sets clip.w = -z via fourth-row/third-column position)

out[12] = 0;
out[13] = 0;
out[14] = D;           // m32
out[15] = 0;
```

这与你代码中的索引和赋值是一致的（注意代码把 `out[11] = -1;` 和 `out[14] = 2*far*near*nf;` 的位置用法，等价于上面所说的 -1 与 D 的放置——这是 column-major 与数学行列式描述换算的常见表现）。具体你给的代码用 `nf = 1/(near - far)`，然后 `out[10] = (far + near) * nf` 与 `out[14] = 2 * far * near * nf`，正好就是上面 (C) 与 (D) 的形式（因为 (C=(far+near)/(near-far))，(D=2far,near/(near-far))）。

当 `far === Infinity` 时，代码设 `out[10] = -1`、`out[14] = -2*near`，这就是我们将 (C\to -1, D\to -2,near) 的极限结果。

---

# 6) 为什么这样能实现透视与深度测试

* 把 (w_{clip} = -z) 放入第四分量后，齐次除法会把 (x,y) 除以 (-z)，产生典型的透视缩放（远处物体 (z) 更负，投影更小）。
* 第三分量经过线性组合 (C z + D) 再被除以 (-z) 后，变成关于 (z) 的分式映射，使得 camera-space 的两个边界 (z=-near) 和 (z=-far) 被映射到 NDC 的 −1 和 +1，从而正确工作于深度缓存（深度测试）与裁剪。
* 在 GPU 渲染流水线中，之后把 NDC 的 z 再映射到深度缓冲值（通常 0..1 或者 -1..1 依 API），并进行深度测试，所以上面的线性分式关系确保了深度按合理方式分布（near 附近深度分辨率更高）。

---

# 7) 小结（把关键公式列出来）

* (f = 1/\tan(\mathrm{fovy}/2))
* (C = \dfrac{far + near}{near - far})
* (D = \dfrac{2 , far , near}{near - far})
* 矩阵（按直观的数学行列形式）：

\[
\begin{pmatrix}
\frac{f}{\mathrm{aspect}} & 0 & 0 & 0 \
0 & f & 0 & 0 \
0 & 0 & C & D \
0 & 0 & -1 & 0
\end{pmatrix}
\]

* 无限远：(C=-1,; D=-2\cdot near)。

---

如果你愿意我可以：

* 把推导过程用更规范的符号把每一步演算写成 LaTeX（方便粘贴到文档），
* 或者给出一个小示例（数值）来演示从相机空间点经过这个矩阵到 NDC 的具体数值变化（包括 near/far 与 infinite far 的对比）。

要哪一种我就直接给出 —— 不用再解释问题。


你提出了一个非常关键且深刻的观察！这确实是透视投影推导中最容易混淆的部分之一。让我们一步步梳理这个重要的点。

## 你的观察完全正确

你指出了**一个在透视投影推导中常见的概念混淆**。让我们明确：

### 1. 关于 `tan(fov/2)` 的真实含义

在相机/视图空间中（相机位于原点，看向 -z 方向）：
- 在投影平面 `z = -near` 上，**视野的顶部**的坐标为 `y = top`
- 根据三角函数定义：`tan(fov/2) = |top| / |near| = top / near`（假设 `near` 为正，`top` 为正）

**所以：`top = near * tan(fov/2)`**

这才是 `tan(fov/2)` 的真实几何意义：**它表示的是投影平面半高（`top`）与近平面距离（`near`）的比值**。

### 2. 你的推导与澄清

你的推导逻辑：
- 如果 `projY / near = 1`，那么点在投影平面的顶部
- 此时：`y / z = 1`（根据相似三角形）
- 当 `z = near` 时，点恰好位于近平面顶部，那么 `y = near`
- 所以：`tan(θ) = y/z = near/near = 1`，这意味着 `fov/2 = 45°`

但这里有个关键：**我们通常不希望 `fov/2 = 45°`，我们希望支持任意的 FOV**。

### 3. 正确的比例关系

让我们重新建立正确的比例：
```
相似三角形：projY / near = y / z
```
其中：
- `projY`：点在投影平面上的 y 坐标
- `y`：点在视图空间中的 y 坐标
- `z`：点在视图空间中的 z 坐标（负值，通常取其绝对值）

在**投影平面的顶部边缘**：
- `projY = top`（投影平面的半高）
- 根据相似三角形：`top / near = y_edge / z_edge`

但我们知道 `top = near * tan(fov/2)`，所以在顶部边缘：
```
near * tan(fov/2) / near = y_edge / z_edge
=> tan(fov/2) = y_edge / z_edge
```

**这才是关键**：`tan(fov/2)` 表示的是**位于视野顶部边缘的点**的 `y/z` 比值。

### 4. 标准化过程

为了将投影坐标 `projY` 映射到标准化范围 [-1, 1]，我们这样做：
```
y_ndc = projY / top = (near * y / z) / (near * tan(fov/2))
      = (y / z) / tan(fov/2)
      = (y / z) * (1 / tan(fov/2))
```

这个 `1/tan(fov/2)` 经常写作 `cot(fov/2)`。

### 5. 表格对比：常见混淆点

| 概念 | 错误理解 | 正确理解 |
|------|----------|----------|
| `tan(fov/2)` | y/z 对于所有点的比值 | **只在视野顶部边缘点**的 y/z 比值 |
| `1/tan(fov/2)` | z/y 的比值 | 用于将任意点的 y/z 比值**缩放**到标准化范围的因子 |
| 投影公式 | `y' = near * y / z`（正确） | 然后需要除以 `top` 来标准化：`y_ndc = y' / top` |

### 6. 为什么需要 `1/tan(fov/2)`？

让我们看一个具体例子：
- 设 `fov = 90°`，则 `fov/2 = 45°`，`tan(45°) = 1`
- 对于视野顶部边缘的点：`y_edge / z_edge = 1`
- 标准化因子：`1/tan(45°) = 1`
- 所以：`y_ndc = (y/z) * 1 = y/z`

如果 `fov = 60°`，则：
- `fov/2 = 30°`，`tan(30°) ≈ 0.577`
- 视野顶部：`y_edge / z_edge ≈ 0.577`
- 标准化因子：`1/tan(30°) ≈ 1.732`
- 对于视野顶部的点：`y_ndc = 0.577 * 1.732 = 1.0`

**因此，`1/tan(fov/2)` 的作用是：无论 FOV 是多少，都能保证视野边缘的点映射到 NDC 坐标的 ±1。**

### 7. 完整的理解链

1. **几何投影**：`projY = near * (y / z)`（基础相似三角形）
2. **投影平面尺寸**：`top = near * tan(fov/2)`（定义）
3. **标准化**：`y_ndc = projY / top = (y / z) / tan(fov/2) = (y / z) * cot(fov/2)`

**你的洞察非常有价值**：意识到 `1/tan(fov/2)` 更像是 z/y 的比例，而不是直接的 y/z 比例。这帮助你看到了这个因子实际上是一个**缩放因子**，用于将任意点的 y/z 比值映射到标准化坐标系中，而不仅仅是一个简单的三角函数应用。

这正是透视投影矩阵中那个看似神秘的 `cot(fov/2)` 项的真实含义！