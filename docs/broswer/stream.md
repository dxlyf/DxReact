Stream API 就像一个“数据的水管”，数据可以像水流一样被分为小块（chunks），在你的 JavaScript 代码中流入、处理和流出，而无需像以前那样等待整个文件下载完毕。

我整理了浏览器内置的核心Stream对象及其使用指南。

### 🧩 浏览器内置Stream对象一览

| 分类 | 对象 | 作用 | 使用场景（一句话速览） |
| :--- | :--- | :--- | :--- |
| **核心** | `ReadableStream` | 数据源，数据由内向外产出 | 处理`fetch`请求的响应体（response body）、读取本地大文件，作为数据流的起点。 |
| **核心** | `WritableStream` | 数据终点，接收并处理数据 | 将流式数据写入本地文件（通过File System Access API）、作为自定义处理管道的终点。 |
| **核心** | `TransformStream` | 中间转换器，对数据进行实时处理 | 实时压缩/解压缩、加密/解密、格式转换、数据过滤，是构建数据处理管道的中间件。 |
| **网络** | `Response.body` | 将HTTP响应体暴露为一个`ReadableStream` | 流式读取服务器返回的AI对话文本、大型JSON、CSV文件、视频流等，实现边接收边处理。 |
| **网络** | `Request.body` | 将一个`ReadableStream`作为HTTP请求体发送 | 流式上传大文件，无需在客户端将整个文件读入内存，更节省资源。 |
| **编码** | `TextDecoderStream` | 将二进制字节流实时解码为字符串流 | 作为`TransformStream`，用于处理从网络接收的文本数据流，例如逐块解析UTF-8编码的CSV或JSON数据。 |
| **编码** | `TextEncoderStream` | 将字符串流实时编码为二进制字节流 | 作为`TransformStream`，用于将生成的文本数据编码后通过`WritableStream`写入文件或通过网络发送。 |
| **压缩** | `CompressionStream` | 实时压缩数据流 | 在客户端对上传的文件进行gzip/deflate压缩，节省带宽和上传时间。 |
| **压缩** | `DecompressionStream` | 实时解压缩数据流 | 对从服务器下载的压缩文件进行实时解压，尤其适合处理大型压缩包。 |
| **文件** | `File.stream()` | 将本地`File`对象转换为`ReadableStream` | 流式读取用户通过`<input type="file">`选择的文件，避免大文件一次性加载导致的内存问题。 |
| **文件** | `Blob.stream()` | 将`Blob`二进制数据转换为`ReadableStream` | 流式读取由Canvas生成的图片、录音产生的音频等二进制数据。 |


### 🔗 如何将它们串联起来

你可以通过 `.pipeThrough()` 和 `.pipeTo()` 方法将这些对象连接起来，形成一个数据处理“管道链”。例如：

`ReadableStream` -> (`.pipeThrough(TransformStream)`) -> `WritableStream`
  1. 上游：通过`fetch`获取数据（`Response.body`）得到一个`ReadableStream`。
  2. 中间：`.pipeThrough(new TextDecoderStream())`将字节流转换为字符串。
  3. 下游：直接使用`.pipeTo()`写入某个目标。

下面我们来逐一看看它们的详细用法。🚀

### 📘 核心教程与代码示例

#### 🔹 ReadableStream（可读流）
`ReadableStream` 是所有流操作的起点。

#### 🔹 基本用法：读取 fetch 响应
**适用场景**：服务器推送的AI对话流、大型JSON或CSV文件等。

```javascript
async function readStream() {
  // 1. 发起fetch请求
  const response = await fetch('https://example.com/large-text.txt');
  // 2. 从响应中获取可读流，并创建读取器（reader）
  const reader = response.body.getReader();

  // 3. 创建一个文本解码器，用于将Uint8Array字节块解码为字符串
  const decoder = new TextDecoder('utf-8');
  let result = '';

  while (true) {
    // 4. 循环读取流中的块（chunk）
    const { done, value } = await reader.read();
    if (done) {
      console.log('流读取完毕');
      break;
    }
    // 5. 解码并处理数据块
    const textChunk = decoder.decode(value, { stream: true });
    result += textChunk;
    console.log('收到新数据块:', textChunk.substring(0, 50), '...');
  }

  document.getElementById('output').textContent = result;
}

readStream();
```

#### 🔹 高级用法：处理大JSON数组
对于100MB+的JSON文件，可以边下载边解析，避免内存爆炸。

```javascript
async function streamJsonArray(url) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // 寻找完整的JSON对象边界（以'}'结尾）
    let boundary = buffer.lastIndexOf('}');
    if (boundary !== -1) {
      const chunk = buffer.slice(0, boundary + 1);
      buffer = buffer.slice(boundary + 1);

      // 处理JSON对象片段
      chunk.split('},').forEach(item => {
        try {
          const json = JSON.parse(item.endsWith('}') ? item : item + '}');
          console.log('解析到项目:', json);
        } catch (e) { /* 忽略不完整片段 */ }
      });
    }
  }
  console.log('流式JSON解析完成');
}
// 来源: 文章《从小水管到洪流：你真的会用前端 Stream API 吗？》
```

#### 🔹 WritableStream（可写流）
`WritableStream` 是数据流的终点，你可以自定义如何消费这些数据。

**适用场景**：接收流式数据并实时写入本地文件、更新DOM或进行处理。

```javascript
// 创建一个可写流，它会记录下所有写入的“数据块”
const writableStream = new WritableStream({
  start(controller) {
    console.log('可写流已打开');
  },
  // 当有数据块写入时，此函数被调用
  write(chunk, controller) {
    console.log('写入数据块：', chunk);
    // 你可以在这里将数据写入文件、缓存或任何地方
  },
  close(controller) {
    console.log('可写流已关闭');
  },
  abort(reason) {
    console.error('可写流中止:', reason);
  }
});

// 获取一个writer来写入数据
const writer = writableStream.getWriter();
writer.write('Hello, ').then(() => writer.write('World!')).then(() => writer.close());
```

#### 🔹 TransformStream（转换流）
`TransformStream` 是数据处理管道的核心中间件。

**适用场景**：实现实时加密、压缩/解压缩、格式转换或数据过滤等逻辑。

```javascript
// 创建一个转换流：将文本块转换为大写
const upperCaseTransform = new TransformStream({
  start(controller) {
    console.log('转换流启动');
  },
  // 核心：对每个数据块进行“转换”操作
  transform(chunk, controller) {
    // chunk是Uint8Array，需要先解码，处理，再编码
    const text = new TextDecoder().decode(chunk);
    const upperText = text.toUpperCase();
    const output = new TextEncoder().encode(upperText);
    controller.enqueue(output); // 将转换后的数据块放入可读端
  },
  flush(controller) {
    console.log('所有数据转换完毕');
  }
});

// 使用管道
fetch('text.txt')
  .then(response => response.body)
  .then(readableStream => readableStream.pipeThrough(upperCaseTransform))
  .then(transformedStream => {
    const reader = transformedStream.getReader();
    return reader.read().then(function process({done, value}) {
      if (done) return;
      console.log(new TextDecoder().decode(value));
      return reader.read().then(process);
    });
  });
```

---

### 💎 总结

Stream API 为现代Web开发带来了几个关键优势：
*   **极致的内存效率**：处理GB级文件不再受内存瓶颈限制。
*   **更快的首字节时间**：用户能第一时间看到流式响应，大幅改善体验。
*   **强大的可组合性**：通过管道将`ReadableStream`、`TransformStream`和`WritableStream`串联，能构建出清晰、可维护的数据处理流程。