以下是 **WebGPU WGSL 着色器编程指南**，涵盖语法要点、内置变量与内置函数。WGSL 是专为 WebGPU 设计的着色语言，语法类似 Rust，着色器入口与资源绑定均通过 `@` 属性声明。

---

### 一、语言版本与环境

- **当前主版本**：WGSL 1.0（随 WebGPU 1.0 发布）
- **可选扩展**：`enable f16;` 启用半精度浮点 `f16` 及相关向量/矩阵。
- **典型文件后缀**：`.wgsl`

---

### 二、基础语法

#### 1. 注释与字面量
```rust
// 单行注释
/* 多行注释 */
let b = true;        // 布尔字面量
let i = 42i;         // i32 字面量
let u = 42u;         // u32 字面量
let f = 3.14f;       // f32 字面量
let h = 3.14hf;      // f16 字面量（需 enable f16）
```

#### 2. 数据类型

| 类别 | 类型 | 示例 |
|------|------|------|
| 标量 | `bool`, `i32`, `u32`, `f32`, `f16`（需扩展） | `var x: f32;` |
| 向量 | `vec2<T>`, `vec3<T>`, `vec4<T>` | `vec3<f32>` |
| 矩阵 | `mat2x2<f32>`, `mat2x3<f32>`, `mat2x4<f32>` 等，方阵可简写 `mat2x2f` 等 | `mat4x4<f32>` |
| 数组 | `array<T, N>`（定长）<br>`array<T>`（运行时大小，仅用于 storage buffer 最后成员） | `array<f32, 16>` |
| 结构体 | `struct` | `struct Light { pos: vec3<f32>; color: vec3<f32>; }` |
| 纹理 | `texture_1d<T>`, `texture_2d<T>`, `texture_2d_array<T>`, `texture_3d<T>`, `texture_cube<T>`, `texture_cube_array<T>` | `texture_2d<f32>` |
| 深度纹理 | `texture_depth_2d`, `texture_depth_2d_array`, `texture_depth_cube`, `texture_depth_cube_array` | `texture_depth_2d` |
| 存储纹理 | `texture_storage_1d<F, R>`, `texture_storage_2d<F, R>` 等，F 为 texel 格式，R 为 `read`/`write`/`read_write` | `texture_storage_2d<rgba8unorm, write>` |
| 采样器 | `sampler`, `sampler_comparison` | `var s: sampler;` |

#### 3. 地址空间与变量声明
使用 `var<地址空间>` 声明变量，地址空间决定存储位置和可见性：

| 地址空间 | 用途 | 声明示例 |
|----------|------|---------|
| `function` | 函数内局部变量（默认，可省略） | `var x: f32;` |
| `private` | 模块级变量，仅当前着色器可见 | `var<private> counter: u32;` |
| `workgroup` | 计算着色器工作组内共享 | `var<workgroup> shared: array<f32, 64>;` |
| `uniform` | 只读统一缓冲区（如摄像机矩阵） | `var<uniform> u_view: mat4x4f;` |
| `storage` | 可读写或只读缓冲区（SSBO） | `var<storage, read_write> buf: array<f32>;` |
| `handle` | 纹理与采样器 | `var t: texture_2d<f32>;` |

#### 4. 常量声明
- **`let`**：运行时不可变的变量（初始化后可读，不可重新赋值）。
- **`const`**：编译时常量。
- **`override`**：管线覆盖常量，可通过 WebGPU API 在创建管线时设定。

```rust
const PI: f32 = 3.14159265;
override resolution: vec2<f32>;   // 管道可定制
let halfPi = PI / 2.0;
```

#### 5. 控制流
- 条件：`if`, `else if`, `else`
- 循环：`for (init; cond; update) { }`, `while`, `loop { break; }`（无限循环）
- 跳转：`break`, `continue`, `discard`（仅片元着色器，丢弃片元）
- 支持 `switch` 语句（用于整数类型）

#### 6. 函数
- 使用 `fn` 关键字，参数必须指定类型，返回值用 `->`。
- 参数可带属性（如 `@builtin`, `@location`）。
- 支持函数重载（参数类型不同）。

```rust
fn add(a: f32, b: f32) -> f32 {
    return a + b;
}
```

---

### 三、入口点与资源绑定

#### 1. 着色器入口用属性标注

| 属性 | 说明 |
|------|------|
| `@vertex` | 顶点着色器入口函数 |
| `@fragment` | 片元着色器入口函数 |
| `@compute` | 计算着色器入口函数，需配合 `@workgroup_size(x, y, z)` |

#### 2. 资源绑定

| 属性 | 说明 |
|------|------|
| `@group(n)` | 绑定组索引 |
| `@binding(n)` | 组内绑定槽索引 |
| `@location(n)` | 顶点输入/输出位置，或片元输入/颜色输出位置 |
| `@builtin(name)` | 内置变量（如 `position`, `vertex_index` 等） |
| `@interpolate(flat)` 等 | 插值修饰（默认为 `perspective, center`） |
| `@workgroup_size(x,y,z)` | 计算着色器工作组大小 |

示例：
```rust
struct VertexIn {
    @location(0) pos: vec3<f32>,
    @location(1) uv: vec2<f32>,
}

struct VertexOut {
    @builtin(position) pos: vec4<f32>,
    @location(0) uv: vec2<f32>,
}

@vertex
fn vs(in: VertexIn) -> VertexOut { ... }

@fragment
fn fs(in: VertexOut) -> @location(0) vec4<f32> { ... }

@compute @workgroup_size(64)
fn cs(@builtin(global_invocation_id) gid: vec3<u32>) { ... }
```

---

### 四、内置变量（@builtin）

#### 1. 顶点着色器
| 内置名 | 类型 | 说明 |
|--------|------|------|
| `vertex_index` | `u32` | 当前顶点索引 |
| `instance_index` | `u32` | 当前实例索引 |
| `position` | `vec4<f32>` | **必须输出**，裁剪空间坐标 |
| `vertex_index` 等 | 可作为输入参数使用 | |

#### 2. 片元着色器
| 内置名 | 类型 | 方向 | 说明 |
|--------|------|------|------|
| `position` | `vec4<f32>` | 输入 | 窗口坐标 (x,y,z,w) 相当于 `gl_FragCoord` |
| `front_facing` | `bool` | 输入 | 是否正面片元 |
| `sample_index` | `u32` | 输入 | 多重采样索引 |
| `sample_mask` | `u32` | 输入 | 采样掩码 |
| `frag_depth` | `f32` | 输出 | 写入自定义深度值 |
| `sample_mask` 也作输出 | `u32` | 输出 | 控制采样掩码输出 |

#### 3. 计算着色器
| 内置名 | 类型 | 说明 |
|--------|------|------|
| `global_invocation_id` | `vec3<u32>` | 全局调用ID |
| `local_invocation_id` | `vec3<u32>` | 工作组内局部ID |
| `workgroup_id` | `vec3<u32>` | 工作组索引 |
| `num_workgroups` | `vec3<u32>` | 分发的工作组总数 |
| `local_invocation_index` | `u32` | 局部线性索引 (local_id.z * size.x*size.y + ...) |

---

### 五、内置函数速查

#### 1. 常用数学函数
| 函数 | 说明 |
|------|------|
| `abs(x)` | 绝对值 |
| `ceil(x)`, `floor(x)` | 向上/向下取整 |
| `round(x)`, `trunc(x)` | 四舍五入/截断 |
| `fract(x)` | 取小数部分 |
| `modf(x)` | 返回 `struct { fract: T, whole: T }` |
| `sign(x)` | 符号函数 |
| `saturate(x)` | 钳制到 [0.0, 1.0] |
| `clamp(x, min, max)` | 截断至区间 |
| `min(a,b)`, `max(a,b)` | 最小值/最大值 |
| `mix(a,b,t)` | 线性混合 `a*(1-t) + b*t` |
| `step(edge, x)` | 阶跃函数 |
| `smoothstep(edge0, edge1, x)` | 平滑阶跃 |
| `pow(x,y)`, `exp(x)`, `exp2(x)` | 幂/指数 |
| `log(x)`, `log2(x)` | 对数 |
| `sqrt(x)`, `inverseSqrt(x)` | 平方根/倒数平方根 |

#### 2. 三角函数（参数为弧度）
`radians(deg)`, `degrees(rad)`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2(y,x)`, `sinh`, `cosh`, `tanh`, `asinh`, `acosh`, `atanh`

#### 3. 几何与向量函数
| 函数 | 说明 |
|------|------|
| `length(v)` | 向量长度 |
| `distance(a,b)` | 两点距离 |
| `dot(a,b)` | 点积 |
| `cross(a,b)` | 叉积 (仅 `vec3<T>`) |
| `normalize(v)` | 归一化 |
| `reflect(i, n)` | 反射向量 |
| `refract(i, n, eta)` | 折射向量 |
| `faceForward(n, i, ng)` | 面朝前向量 |

#### 4. 矩阵函数
- 矩阵乘法使用 `*`：当矩阵维度匹配时执行线性代数乘法；两个相同大小的矩阵则进行逐分量乘法。
- `transpose(m)` — 转置
- `determinant(m)` — 行列式 (方阵)
- `inverse(m)` — 求逆 (方阵)

#### 5. 纹理采样函数
（`t` 为纹理，`s` 为采样器，`coord` 为纹理坐标）

| 函数 | 说明 |
|------|------|
| `textureDimensions(t)` | 返回纹理尺寸 |
| `textureNumLayers(t)` | 纹理层数（数组纹理） |
| `textureNumLevels(t)` | Mipmap 级数 |
| `textureNumSamples(t)` | 多重采样数 |
| `textureLoad(t, coords, array_index?, level?)` | 直接读取 texel，无过滤 |
| `textureSample(t, s, coord)` | 常规采样 |
| `textureSampleBias(t, s, coord, bias)` | 带 Mipmap 偏差采样 |
| `textureSampleLevel(t, s, coord, lod)` | 指定 LOD 采样 |
| `textureSampleGrad(t, s, coord, ddx, ddy)` | 指定梯度采样 |
| `textureSampleCompare(t, s, coord, ref)` | 深度比较采样（需 `texture_depth_*` 和 `sampler_comparison`） |
| `textureGather(c, t, s, coord)` | 读取相邻 2x2 块（支持 `red`, `green`, `blue`, `alpha`） |
| `textureGatherCompare(t, s, coord, ref)` | 深度比较采集 |
| `textureStore(t, coords, value)` | 写入存储纹理 |

#### 6. 原子操作（仅适用于 `atomic<u32>` 或 `atomic<i32>` 类型变量）
| 函数 | 说明 |
|------|------|
| `atomicLoad(ptr)` | 原子读 |
| `atomicStore(ptr, value)` | 原子写 |
| `atomicAdd(ptr, value)` | 原子加 |
| `atomicSub(ptr, value)` | 原子减 |
| `atomicMax(ptr, value)` | 原子最大值 |
| `atomicMin(ptr, value)` | 原子最小值 |
| `atomicAnd(ptr, value)` | 原子按位与 |
| `atomicOr(ptr, value)` | 原子按位或 |
| `atomicXor(ptr, value)` | 原子按位异或 |
| `atomicExchange(ptr, value)` | 原子交换 |
| `atomicCompareExchangeWeak(ptr, cmp, val)` | 原子比较交换，返回旧值 |

#### 7. 同步与屏障
| 函数 | 说明 |
|------|------|
| `workgroupBarrier()` | 工作组内全部调用同步 |
| `storageBarrier()` | 存储缓冲区写后读可见 |
| `textureBarrier()` | 纹理写后读可见 |
| `workgroupUniformLoad(ptr)` | 工作组内从单一调用广播读取（优化） |

#### 8. 位操作函数
`countLeadingZeros`, `countOneBits`, `countTrailingZeros`, `extractBits`, `insertBits`, `reverseBits`, `firstLeadingBit`, `firstTrailingBit`

#### 9. 数据打包/解包函数
- 打包：`pack4x8snorm`, `pack4x8unorm`, `pack2x16snorm`, `pack2x16unorm`, `pack2x16float`
- 解包：`unpack4x8snorm`, `unpack4x8unorm`, `unpack2x16snorm`, `unpack2x16unorm`, `unpack2x16float`

#### 10. 类型转换与构造
- 显式转换：`f32(i)`, `u32(f)`, `vec3<f32>(v2, 0.0)` 等。
- 向量支持重组（swizzle）：`v.xyz`, `v.rgba`，但不能像 GLSL 那样多重重组赋值（只读）。

---

### 六、精度与 `f16` 扩展

- 默认所有浮点运算为 `f32`（高精度）。
- 若需使用半精度，须在着色器顶部启用：
  ```rust
  enable f16;
  ```
  之后可使用 `f16` 类型、`vec2<f16>` 等，以及对应矩阵。

---

### 七、与 GLSL 的关键差异提醒

| 特性 | GLSL (WebGL) | WGSL (WebGPU) |
|------|-------------|---------------|
| 入口点 | `void main()` | `@vertex` 等标记的函数 |
| 全局变量 | `uniform`/`attribute`/`varying` | `var<uniform>`, `var<storage>`，参数通过 `@location` 传递 |
| 输出颜色 | `gl_FragColor` | 返回 `@location(0) vec4<f32>` |
| 矩阵乘法 | `*` 总是线性代数乘法 | `*` 在大小相同矩阵时为逐分量乘，形状匹配时为线性代数乘 |
| 精度限定符 | `highp`, `mediump`, `lowp` | 无，直接使用 `f32`/`f16` |
| 纹理采样 | `texture2D(s, coord)` | `textureSample(t, s, coord)` |
| 丢弃片元 | `discard;` | `discard;` |
| 屏障 | `barrier()` (不标准) | `workgroupBarrier()` 等明确函数 |

这份 WGSL 参考可搭配 WebGPU 开发时快速查阅。如需更详细的函数签名或特定阶段的示例，欢迎继续提问。