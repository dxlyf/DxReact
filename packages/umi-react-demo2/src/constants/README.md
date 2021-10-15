# 
* [常量](#常量)
* [枚举](#枚举)

## 常量
通过定义不可修改的变量.常量可以是值常量或对象常用.命名通常用全大写,用下划线分隔.来表示该字段是内置的常量
例如：域名、文件上传路径、图片服务器等

### 静态定义
```js
    // 系统登录路径
    const SYSTEM_LOGIN_URL='www.baidu.com'

    // 系统主题类型
    const SYSTEM_THEME_TYPES={
        DARK:"dark",
        LIGHT:"light"
    }
    
```
### 动态定义
理论常量是不可变的，在运行时不能进行修改。但可以借助node编译手段在编译时进行动态定义值

```js
    webpack({
        plugins:[new webpack.DefinePlugin({
              __NODE_SYSTEM_API_ENV__:JSON.stringify('/api')
        })]
    })
    const SYSTEM_API_ENV=__NODE_SYSTEM_API_ENV__
```