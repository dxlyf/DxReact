我来帮你搭建一个基于 Koa + React 的 SSR (服务端渲染) 项目。

## 1. 初始化项目并安装依赖

```bash
mkdir koa-react-ssr
cd koa-react-ssr
npm init -y

# 安装 Koa 相关依赖
npm install koa koa-router koa-static koa-bodyparser

# 安装 React 相关依赖
npm install react react-dom

# 安装 Webpack 相关依赖
npm install -D webpack webpack-cli webpack-node-externals
npm install -D babel-loader @babel/core @babel/preset-env @babel/preset-react
npm install -D @babel/plugin-transform-runtime @babel/runtime

# 安装开发依赖
npm install -D nodemon concurrently

# 安装路由
npm install react-router-dom
```

## 2. 配置 Babel

创建 `.babelrc` 文件：

```json
{
  "presets": [
    "@babel/preset-env",
    ["@babel/preset-react", {
      "runtime": "automatic"
    }]
  ],
  "plugins": [
    "@babel/plugin-transform-runtime"
  ]
}
```

## 3. 配置 Webpack

### `webpack.config.js` - Webpack 配置

```javascript
const path = require('path');
const nodeExternals = require('webpack-node-externals');

// 服务端配置
const serverConfig = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  target: 'node',
  externals: [nodeExternals()],
  entry: './src/server/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'server.js',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};

// 客户端配置
const clientConfig = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/client/index.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};

module.exports = [serverConfig, clientConfig];
```

## 4. 创建项目结构

```
koa-react-ssr/
├── src/
│   ├── client/
│   │   ├── index.js          # 客户端入口
│   │   └── App.js            # React 应用
│   ├── server/
│   │   ├── index.js          # 服务端入口
│   │   ├── server.js         # Koa 服务器
│   │   └── renderer.js       # SSR 渲染器
│   ├── components/
│   │   ├── Header.js
│   │   ├── Footer.js
│   │   └── ...
│   ├── pages/
│   │   ├── Home.js
│   │   ├── About.js
│   │   └── Users.js
│   └── routes/
│       └── index.js          # 路由配置
├── public/
│   └── (客户端打包文件)
├── views/
│   └── template.ejs          # HTML 模板
├── .babelrc
├── webpack.config.js
└── package.json
```

## 5. 创建服务端代码

### `src/server/server.js` - Koa 服务器

```javascript
const Koa = require('koa');
const Router = require('koa-router');
const serve = require('koa-static');
const bodyParser = require('koa-bodyparser');
const path = require('path');
const renderer = require('./renderer');

const app = new Koa();
const router = new Router();

// 中间件
app.use(bodyParser());
app.use(serve(path.join(__dirname, '../../public')));

// 日志中间件
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

// API 路由（SSR 前的数据预取）
router.get('/api/users', async (ctx) => {
  // 模拟获取用户数据
  const users = [
    { id: 1, name: '张三', email: 'zhangsan@example.com', age: 25 },
    { id: 2, name: '李四', email: 'lisi@example.com', age: 30 },
    { id: 3, name: '王五', email: 'wangwu@example.com', age: 28 }
  ];
  
  ctx.body = {
    code: 200,
    data: users,
    message: 'success'
  };
});

router.get('/api/user/:id', async (ctx) => {
  const { id } = ctx.params;
  const user = {
    id: parseInt(id),
    name: `用户${id}`,
    email: `user${id}@example.com`,
    age: 25 + parseInt(id)
  };
  
  ctx.body = {
    code: 200,
    data: user,
    message: 'success'
  };
});

// SSR 路由 - 所有页面请求都走这里
router.get('(.*)', async (ctx) => {
  try {
    const context = {};
    const html = await renderer(ctx.url, context);
    
    if (context.url) {
      // 重定向
      ctx.redirect(context.url);
    } else if (context.notFound) {
      ctx.status = 404;
      ctx.body = html;
    } else {
      ctx.status = 200;
      ctx.body = html;
    }
  } catch (error) {
    console.error('SSR 错误:', error);
    ctx.status = 500;
    ctx.body = `SSR 渲染失败: ${error.message}`;
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 SSR 服务器已启动: http://localhost:${PORT}`);
  console.log(`📝 环境: ${process.env.NODE_ENV || 'development'}`);
});
```

### `src/server/renderer.js` - SSR 渲染器

```javascript
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { StaticRouter } = require('react-router-dom/server');
const { App } = require('../client/App');
const fs = require('fs');
const path = require('path');

// 读取 HTML 模板
let template = null;

if (process.env.NODE_ENV === 'production') {
  // 生产环境读取构建后的文件
  template = fs.readFileSync(path.join(__dirname, '../../views/template.ejs'), 'utf-8');
} else {
  // 开发环境动态读取
  template = fs.readFileSync(path.join(__dirname, '../../views/template.ejs'), 'utf-8');
}

module.exports = async (url, context) => {
  // 数据预取逻辑
  let initialData = {};
  
  // 根据路由预取数据
  if (url === '/users') {
    try {
      const response = await fetch('http://localhost:3000/api/users');
      const result = await response.json();
      initialData = { users: result.data };
    } catch (error) {
      console.error('数据预取失败:', error);
    }
  } else if (url.startsWith('/user/')) {
    const id = url.split('/').pop();
    try {
      const response = await fetch(`http://localhost:3000/api/user/${id}`);
      const result = await response.json();
      initialData = { user: result.data };
    } catch (error) {
      console.error('数据预取失败:', error);
    }
  }
  
  // 渲染 React 组件
  const appHtml = ReactDOMServer.renderToString(
    React.createElement(
      StaticRouter,
      { location: url, context },
      React.createElement(App, { initialData })
    )
  );
  
  // 注入客户端脚本和初始数据
  const html = template
    .replace('<!-- APP_HTML -->', appHtml)
    .replace('<!-- INITIAL_DATA -->', JSON.stringify(initialData).replace(/</g, '\\u003c'));
  
  return html;
};
```

## 6. 创建客户端代码

### `src/client/index.js` - 客户端入口

```javascript
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';

// 获取服务端注入的初始数据
const initialData = window.__INITIAL_DATA__ || {};

// 水合（hydrate）客户端应用
hydrateRoot(
  document.getElementById('root'),
  <BrowserRouter>
    <App initialData={initialData} />
  </BrowserRouter>
);
```

### `src/client/App.js` - React 应用

```javascript
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import './App.css';

// 组件
const Header = () => (
  <header style={styles.header}>
    <nav style={styles.nav}>
      <Link to="/" style={styles.navLink}>首页</Link>
      <Link to="/about" style={styles.navLink}>关于</Link>
      <Link to="/users" style={styles.navLink}>用户列表</Link>
    </nav>
  </header>
);

const Footer = () => (
  <footer style={styles.footer}>
    <p>&copy; 2026 Koa + React SSR 示例</p>
  </footer>
);

// 首页组件
const Home = () => {
  const [count, setCount] = useState(0);
  
  return (
    <div style={styles.container}>
      <h1>欢迎使用 Koa + React SSR</h1>
      <div style={styles.card}>
        <h2>服务端渲染 (SSR) 示例</h2>
        <p>计数器: {count}</p>
        <button onClick={() => setCount(count + 1)} style={styles.button}>
          点击增加
        </button>
        <p style={styles.info}>
          这个页面是在服务端渲染的，但交互功能在客户端也正常工作！
        </p>
      </div>
    </div>
  );
};

// 关于页面
const About = () => (
  <div style={styles.container}>
    <h1>关于我们</h1>
    <div style={styles.card}>
      <h2>什么是 SSR？</h2>
      <p>服务端渲染 (Server-Side Rendering) 是指在服务器上生成完整的 HTML 页面，然后发送给客户端。</p>
      <h3>优点：</h3>
      <ul>
        <li>✅ 更快的首屏加载速度</li>
        <li>✅ 更好的 SEO 优化</li>
        <li>✅ 更好的社交分享预览</li>
      </ul>
      <h3>技术栈：</h3>
      <ul>
        <li>Koa - Web 服务器框架</li>
        <li>React - UI 框架</li>
        <li>React Router - 路由管理</li>
        <li>Webpack - 构建工具</li>
      </ul>
    </div>
  </div>
);

// 用户列表页面
const Users = ({ initialUsers = [] }) => {
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState(!initialUsers.length);
  
  useEffect(() => {
    // 如果服务端没有提供数据，客户端获取
    if (!users.length) {
      fetchUsers();
    }
  }, []);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      const result = await response.json();
      setUsers(result.data);
    } catch (error) {
      console.error('获取用户失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div style={styles.container}>
        <h1>用户列表</h1>
        <div style={styles.card}>
          <p>加载中...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div style={styles.container}>
      <h1>用户列表</h1>
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>姓名</th>
              <th>邮箱</th>
              <th>年龄</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.age}</td>
                <td>
                  <Link to={`/user/${user.id}`} style={styles.link}>
                    查看详情
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 用户详情页面
const UserDetail = ({ initialUser = null }) => {
  const { id } = useParams();
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  
  useEffect(() => {
    if (!user) {
      fetchUser();
    }
  }, [id]);
  
  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/${id}`);
      const result = await response.json();
      setUser(result.data);
    } catch (error) {
      console.error('获取用户详情失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div style={styles.container}>
        <h1>用户详情</h1>
        <div style={styles.card}>
          <p>加载中...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div style={styles.container}>
        <h1>用户不存在</h1>
        <div style={styles.card}>
          <p>抱歉，未找到该用户信息。</p>
          <Link to="/users" style={styles.button}>返回列表</Link>
        </div>
      </div>
    );
  }
  
  return (
    <div style={styles.container}>
      <h1>用户详情</h1>
      <div style={styles.card}>
        <h2>{user.name}</h2>
        <ul style={styles.userInfo}>
          <li><strong>ID:</strong> {user.id}</li>
          <li><strong>邮箱:</strong> {user.email}</li>
          <li><strong>年龄:</strong> {user.age}</li>
        </ul>
        <Link to="/users" style={styles.button}>返回列表</Link>
      </div>
    </div>
  );
};

// 404 页面
const NotFound = () => (
  <div style={styles.container}>
    <h1>404 - 页面未找到</h1>
    <div style={styles.card}>
      <p>很抱歉，您访问的页面不存在。</p>
      <Link to="/" style={styles.button}>返回首页</Link>
    </div>
  </div>
);

// 主应用组件
export const App = ({ initialData = {} }) => {
  return (
    <div>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/users" element={<Users initialUsers={initialData.users} />} />
          <Route path="/user/:id" element={<UserDetail initialUser={initialData.user} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

// 样式对象
const styles = {
  header: {
    background: '#667eea',
    padding: '1rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  nav: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    gap: '2rem'
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  card: {
    background: '#f8f9fa',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '20px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  button: {
    background: '#667eea',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    textDecoration: 'none',
    display: 'inline-block'
  },
  info: {
    marginTop: '15px',
    color: '#666',
    fontSize: '14px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  link: {
    color: '#667eea',
    textDecoration: 'none'
  },
  userInfo: {
    listStyle: 'none',
    padding: 0
  },
  footer: {
    background: '#333',
    color: 'white',
    textAlign: 'center',
    padding: '20px',
    marginTop: '50px'
  }
};
```

### `src/client/App.css` - 样式文件

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

button {
  transition: all 0.3s ease;
}

button:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}

a {
  transition: color 0.3s ease;
}

a:hover {
  color: #764ba2;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background: #667eea;
  color: white;
}

tr:hover {
  background: #f5f5f5;
}

@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
  
  table {
    font-size: 12px;
  }
  
  th, td {
    padding: 8px;
  }
}
```

## 7. 创建 HTML 模板

### `views/template.ejs` - HTML 模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Koa + React SSR 示例</title>
    <meta name="description" content="使用 Koa 和 React 构建的服务端渲染应用">
    <link rel="stylesheet" href="/bundle.css">
</head>
<body>
    <div id="root"><!-- APP_HTML --></div>
    
    <script>
        window.__INITIAL_DATA__ = <!-- INITIAL_DATA -->;
    </script>
    <script src="/bundle.js"></script>
</body>
</html>
```

## 8. 配置 package.json 脚本

```json
{
  "name": "koa-react-ssr",
  "version": "1.0.0",
  "description": "Koa + React SSR 示例",
  "main": "dist/server.js",
  "scripts": {
    "build": "webpack --mode=production",
    "build:dev": "webpack --mode=development",
    "start": "NODE_ENV=production node dist/server.js",
    "dev": "concurrently \"webpack --watch\" \"nodemon --watch dist dist/server.js\"",
    "clean": "rm -rf dist public"
  },
  "keywords": ["koa", "react", "ssr"],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "koa": "^2.14.2",
    "koa-bodyparser": "^4.4.1",
    "koa-router": "^12.0.1",
    "koa-static": "^5.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.2"
  },
  "devDependencies": {
    "@babel/core": "^7.22.10",
    "@babel/plugin-transform-runtime": "^7.22.10",
    "@babel/preset-env": "^7.22.10",
    "@babel/preset-react": "^7.22.5",
    "@babel/runtime": "^7.22.10",
    "babel-loader": "^9.1.3",
    "concurrently": "^8.2.0",
    "css-loader": "^6.8.1",
    "nodemon": "^3.0.1",
    "style-loader": "^3.3.3",
    "webpack": "^5.88.2",
    "webpack-cli": "^5.1.4",
    "webpack-node-externals": "^3.0.0"
  }
}
```

## 9. 创建开发脚本

### `scripts/dev.js` - 开发辅助脚本（可选）

```javascript
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 启动 SSR 开发环境...\n');

// 确保公共目录存在
if (!fs.existsSync(path.join(__dirname, '../public'))) {
  fs.mkdirSync(path.join(__dirname, '../public'));
}

// 启动 Webpack 构建
const webpack = spawn('npm', ['run', 'build:dev'], {
  stdio: 'inherit',
  shell: true
});

// 启动服务器
setTimeout(() => {
  const server = spawn('nodemon', ['--watch', 'dist', 'dist/server.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  process.on('SIGINT', () => {
    webpack.kill();
    server.kill();
    process.exit();
  });
}, 3000);
```

## 10. 启动项目

```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 生产运行
npm start
```

## 11. 高级优化 - 使用 React.lazy 和 Suspense

### `src/client/App.js` 的优化版本

```javascript
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

// 懒加载组件
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Users = lazy(() => import('./pages/Users'));
const UserDetail = lazy(() => import('./pages/UserDetail'));

// 加载组件
const Loading = () => (
  <div style={{ textAlign: 'center', padding: '50px' }}>
    <h2>加载中...</h2>
  </div>
);

export const App = ({ initialData = {} }) => {
  return (
    <div>
      <Header />
      <main>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/users" element={<Users initialUsers={initialData.users} />} />
            <Route path="/user/:id" element={<UserDetail initialUser={initialData.user} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};
```

## 12. 性能优化配置

### 添加缓存中间件到 `src/server/server.js`

```javascript
// 静态文件缓存
app.use(serve(path.join(__dirname, '../../public'), {
  maxage: 365 * 24 * 60 * 60 * 1000, // 1年
  immutable: true
}));

// 内存缓存 SSR 结果
const cache = new Map();

router.get('(.*)', async (ctx) => {
  // 检查缓存
  if (cache.has(ctx.url)) {
    ctx.body = cache.get(ctx.url);
    return;
  }
  
  try {
    const context = {};
    const html = await renderer(ctx.url, context);
    
    // 缓存 60 秒
    cache.set(ctx.url, html);
    setTimeout(() => cache.delete(ctx.url), 60000);
    
    ctx.body = html;
  } catch (error) {
    console.error('SSR 错误:', error);
    ctx.status = 500;
    ctx.body = `SSR 渲染失败: ${error.message}`;
  }
});
```

## 项目特点

- ✅ 完整的 SSR 实现
- ✅ 数据预取（服务端获取数据）
- ✅ 客户端水合（Hydration）
- ✅ 路由支持（React Router）
- ✅ 热更新开发环境
- ✅ 性能优化（缓存、懒加载）
- ✅ SEO 友好
- ✅ 响应式设计

现在你有了一个完整的 Koa + React SSR 项目！服务端会生成完整的 HTML，然后客户端会接管交互，实现最佳的性能和 SEO 效果。