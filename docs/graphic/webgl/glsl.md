以下是 **WebGL GLSL 着色器编程指南**，涵盖语法要点、内置变量与内置函数，同时注明 WebGL 1.0 (GLSL ES 1.00) 与 WebGL 2.0 (GLSL ES 3.00) 的关键差异。

---

### 一、版本与基础设定

| WebGL版本 | GLSL 版本 | 关键特性 |
|-----------|-----------|----------|
| WebGL 1.0 | GLSL ES 1.00 | `attribute`/`varying`、`gl_FragColor` |
| WebGL 2.0 | GLSL ES 3.00 | `in`/`out`、无内置 `gl_FragColor`、支持整数/位运算等 |

**着色器第一行必须声明版本**（WebGL 2.0 推荐显式声明）：
```glsl
// WebGL 2.0
#version 300 es
```

---

### 二、基础语法

#### 1. 数据类型
| 类别 | 类型 | 示例 |
|------|------|------|
| 标量 | `float`, `int`, `bool` | `float a = 1.0;` |
| 向量 | `vec2`, `vec3`, `vec4` | `vec4 color = vec4(1.0,0.0,0.0,1.0);` |
| 向量(整数) | `ivec2`, `ivec3`, `ivec4`  (WebGL 2) | `ivec2 coord;` |
| 向量(布尔) | `bvec2`, `bvec3`, `bvec4` | `bvec3 mask;` |
| 矩阵 | `mat2`, `mat3`, `mat4` | `mat4 modelMatrix;` |
| 采样器(纹理) | `sampler2D`, `samplerCube` (WebGL 1) <br> `sampler2D`, `sampler3D`, `samplerCube`, `sampler2DShadow` 等 (WebGL 2) | `uniform sampler2D uTexture;` |
| 结构体 | `struct` | `struct Light { vec3 pos; vec3 color; };` |
| 数组 | 定长数组 | `float arr[3];` (WebGL 1 索引必须为常量，WebGL 2 支持变量索引) |

#### 2. 变量修饰符
**WebGL 1.0 (GLSL ES 1.00)**  
| 修饰符 | 用途 |
|--------|------|
| `attribute` | 顶点着色器输入，逐顶点数据（位置、法线等） |
| `uniform` | 全局只读变量，CPU 传入，着色器间共享 |
| `varying` | 顶点着色器输出 → 片元着色器输入，自动插值 |
| `const` | 编译时常量 |

**WebGL 2.0 (GLSL ES 3.00)**  
| 修饰符 | 用途 |
|--------|------|
| `in` | 代替 `attribute` 作为顶点输入，片元着色器也可用 `in` 接收插值数据 |
| `out` | 代替 `varying` 声明顶点着色器输出；片元着色器用 `out` 声明输出颜色 |
| `uniform` | 同上 |
| `const` | 同上 |

#### 3. 精度限定符
- **`highp`** 高精度（顶点着色器默认）
- **`mediump`** 中精度（片元着色器部分变量默认，但 WebGL 1 片元着色器无默认，必须声明 `precision mediump float;`）
- **`lowp`** 低精度

示例：
```glsl
precision highp float;
mediump vec3 normal;
```

#### 4. 流程控制
与 C 语言类似：
- 条件：`if`, `else if`, `else`
- 循环：`for`, `while`, `do-while`
- 跳转：`break`, `continue`, `discard`（仅片元着色器，丢弃片元）
- WebGL 1 循环限制：循环变量必须为常量或 uniform，WebGL 2 放宽。

#### 5. 预处理指令
```glsl
#define PI 3.1415926
#undef PI
#if defined(FLAG)
#ifdef FLAG
#ifndef FLAG
#endif
#extension GL_EXT_shader_texture_lod : enable
#version 300 es
#line 10
#error error_message
```
WebGL 中 `#extension` 常用于启用纹理 LOD 等扩展。

#### 6. 函数与结构
- 支持返回值，参数可用 `in`、`out`、`inout` 限定。
- 支持函数重载（WebGL 2 中更灵活）。
- 必须执行 `main()` 函数。

#### 7. 注释
```glsl
// 单行注释
/* 多行注释 */
```

---

### 三、内置变量

#### 1. 顶点着色器内置变量
| 变量名 | 类型 | 说明 | WebGL 版本 |
|--------|------|------|-------------|
| `gl_Position` | `highp vec4` | 必须写入，裁剪空间坐标 | 全部 |
| `gl_PointSize` | `mediump float` | 点精灵大小（需开启 `gl.POINTS`） | 全部 |
| `gl_VertexID` | `highp int` | 当前顶点索引 | WebGL 2 |
| `gl_InstanceID` | `highp int` | 当前实例索引 | WebGL 2 |

#### 2. 片元着色器内置变量
| 变量名 | 类型 | 说明 | WebGL 版本 |
|--------|------|------|-------------|
| `gl_FragCoord` | `mediump vec4` | 窗口坐标(x,y)及深度(z)，1/w | 全部 |
| `gl_FrontFacing` | `bool` | 是否正面片元（用于双面光照） | 全部 |
| `gl_PointCoord` | `mediump vec2` | 点精灵内的纹理坐标(0~1) | 全部 |
| `gl_FragColor` | `mediump vec4` | **片元输出颜色** (WebGL 1) | WebGL 1 |
| `gl_FragData[n]` | `mediump vec4` | 多渲染目标输出 (WebGL 1) | WebGL 1 扩展 |
| 自定义 `out vec4` |  | 片元输出 (WebGL 2)，替代 `gl_FragColor` | WebGL 2 |

#### 3. 内置常量（部分）
| 常量名 | 含义 | 最小值 |
|--------|------|--------|
| `gl_MaxVertexAttribs` | 最大 attribute 数量 | 8 |
| `gl_MaxVertexUniformVectors` | 顶点着色器最大 uniform 向量数 | 128 |
| `gl_MaxFragmentUniformVectors` | 片元着色器最大 uniform 向量数 | 16 |
| `gl_MaxTextureImageUnits` | 最大纹理单元数 | 8 |
| `gl_MaxVaryingVectors` | 最大 varying 向量数 | 8 |
| `gl_MaxDrawBuffers` | 最大绘制缓冲数 (WebGL 2) | 4 |

---

### 四、内置函数速查

#### 1. 三角函数（输入单位为弧度）
`radians(deg)`, `degrees(rad)`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan(y,x)`, `sinh`, `cosh`, `tanh`, `asinh`, `acosh`, `atanh` (后六个 WebGL 2)

#### 2. 指数函数
`pow(x,y)`, `exp(x)`, `log(x)`, `exp2(x)`, `log2(x)`, `sqrt(x)`, `inversesqrt(x)`

#### 3. 通用数值函数
| 函数 | 说明 |
|------|------|
| `abs(x)` | 绝对值 |
| `sign(x)` | 符号函数 |
| `floor(x)` | 向下取整 |
| `ceil(x)` | 向上取整 |
| `fract(x)` | 取小数部分 |
| `mod(x,y)` | 取模（x-y*floor(x/y)） |
| `min(a,b)` | 最小值 |
| `max(a,b)` | 最大值 |
| `clamp(x,min,max)` | 截断至[min,max] |
| `mix(a,b,t)` | 线性混合 a*(1-t)+b*t |
| `step(edge,x)` | 若 x<edge 返回0，否则1 |
| `smoothstep(edge0,edge1,x)` | 平滑阶跃 |
| `isnan(x)`, `isinf(x)` | WebGL 2 判断非数值/无穷 |
| `floatBitsToInt`, `intBitsToFloat` 等 | WebGL 2 位转换 |

#### 4. 几何与向量函数
| 函数 | 说明 |
|------|------|
| `length(v)` | 向量长度 |
| `distance(a,b)` | 两点距离 |
| `dot(a,b)` | 点积 |
| `cross(a,b)` | 叉积 (仅vec3) |
| `normalize(v)` | 归一化 |
| `reflect(I,N)` | 反射向量 |
| `refract(I,N,eta)` | 折射向量 |
| `faceforward(N,I,Nref)` | 面朝前向量 |
| `transpose(m)` | 矩阵转置 |
| `determinant(m)` | 矩阵行列式 (WebGL 2) |
| `inverse(m)` | 矩阵求逆 (WebGL 2) |

#### 5. 向量/矩阵关系函数
- `lessThan(a,b)`, `lessThanEqual`, `greaterThan`, `greaterThanEqual`, `equal`, `notEqual`
- 返回 `bvec` 类型，支持逐分量比较。
- `any(bvec)`, `all(bvec)`, `not(bvec)` 布尔向量操作。

#### 6. 矩阵函数
`matrixCompMult(m1,m2)` — 矩阵逐元素乘法（非线性代数乘法，线性代数乘法直接用 `*`）

#### 7. 纹理采样函数
**WebGL 1 (GLSL ES 1.00)**
| 函数 | 说明 |
|------|------|
| `texture2D(sampler, coord)` | 2D纹理采样 |
| `texture2DProj(sampler, coord)` | 投影纹理采样 |
| `texture2DLod(sampler, coord, lod)` | 2D纹理指定LOD (需扩展) |
| `textureCube(sampler, coord)` | 立方体贴图采样 |
| `texture2D(sampler, coord, bias)` | 带LOD偏置 (仅片元着色器) |

**WebGL 2 (GLSL ES 3.00)**
| 函数 | 说明 |
|------|------|
| `texture(sampler, coord)` | 通用纹理采样 |
| `textureLod(sampler, coord, lod)` | 指定LOD (顶点着色器可用) |
| `textureGrad(sampler, coord, dPdx, dPdy)` | 指定梯度 |
| `textureProj(sampler, coord)` | 投影纹理 |
| `texelFetch(sampler, ivecCoord, lod)` | 直接读取像素，无过滤 |
| `textureSize(sampler, lod)` | 获取纹理尺寸 |
| `texture(sampler2DArray, …)` | 支持2D数组纹理等 |

---

### 五、关键注意事项

1. **WebGL 1 片元着色器必须声明精度**：如 `precision mediump float;` 放在顶部。
2. **WebGL 2 不再使用 `gl_FragColor`**，须用 `out vec4 fragColor;` 并写入。
3. **隐式类型转换严格**：`float a = 1;` 错误，必须 `1.0`。
4. **条件编译与扩展**：纹理 LOD 在 WebGL 1 需 `#extension GL_EXT_shader_texture_lod : enable`。
5. **矩阵乘法**：`*` 为线性代数乘法，`matrixCompMult` 为逐元素乘。
6. **数组索引**：WebGL 1 只能用常量整数或 uniform 索引，WebGL 2 可用变量。

这份列表可作为日常编写 WebGL/GLSL 着色器时的快速参考。如需某个函数的详细说明或示例，可以继续提出。

是的，WebGL 的 GLSL 中也**有** `fwidth`、`dFdx`、`dFdy` 这类导数函数，但它们的可用性取决于 WebGL 版本。

**这些函数的作用**  
它们用于计算**屏幕空间中相邻片元之间变量值的偏导数**，常用于抗锯齿、边缘检测、计算面法线、纹理细节级别等。  
- `dFdx(p)` – 当前片元在屏幕水平方向上 `p` 的变化率。  
- `dFdy(p)` – 当前片元在屏幕垂直方向上 `p` 的变化率。  
- `fwidth(p)` – 等效于 `abs(dFdx(p)) + abs(dFdy(p))`，常用于估算变化范围。  
（内部依赖 2x2 片元块并行计算）

**WebGL 1.0**  
- 这些函数**不属于 GLSL ES 1.00 核心规范**，需要启用扩展 `OES_standard_derivatives`。  
- 使用前必须在着色器顶部声明：  
  ```glsl
  #extension GL_OES_standard_derivatives : enable
  ```
- 之后即可使用 `dFdx`、`dFdy`、`fwidth`，**只允许在片元着色器内**调用。

**WebGL 2.0**  
- 直接基于 GLSL ES 3.00，**内置支持**这些函数，无需任何扩展。  
- 注意 GLSL ES 3.00 中拼写为 **`dFdx`** 和 **`dFdy`**（早期曾称 `dFdx`/`dFdy` 或 `dFdxCoarse`/`dFdyCoarse`，但标准名称就是 `dFdx` 和 `dFdy`），同样只能在片元着色器中使用。

**简单示例（WebGL 2.0 片元着色器）**  
```glsl
#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

void main() {
    float dx = dFdx(v_uv.x);
    float dy = dFdy(v_uv.y);
    float edge = abs(dx) + abs(dy);       // 或直接用 fwidth(v_uv.x)
    fragColor = vec4(vec3(edge), 1.0);
}
```

所以，你在 WebGL 中完全可以使用它们，只需注意 WebGL 1 要开扩展，WebGL 2 可直接使用。