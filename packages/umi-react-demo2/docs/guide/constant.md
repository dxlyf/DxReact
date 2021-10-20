---
title: 系统常量
nav:
  path: /guide
group:
  path: /guide/constant
---

# 系统公共常量和枚举字典
* [静态定义](#静态定义)
* [动态定义](#动态定义)

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

## defineKeyValueMap
- 如果只是简单的状态和类型定义，请使用枚举或定义普通对象映射
- `defineKeyValueMap`为什么要使用数组映射，因为对象的key它是无法保证for 的顺序和你定义时一致。
- 在定义时key 和value的值请不要相同
``` ts 
 enum PRODUCT_STATUS{
     unPublished=1
     Published
 }
 const PRODUCT_STATUS={
     unPublished:1,
     Published:2
 }
```
```ts
import {defineKeyValueMap,KeyValueData} from '@/utils/util'
// 显性定义key字面文本,用于typescript 语法提示
export const PRODUCT_STATUS = defineKeyValueMap<KeyValueData,'unPublished'|'Published'>([{
    key:'unPublished',
    value:1,
    text:'未发布'
},{
    key:'Published',
    value:2,
    text:'已发布'
}])
 //显示文本
 PRODUCT_STATUS.text(1)或PRODUCT_STATUS('unPublished')
 // 状态判断
 PRODUCT_STATUS.value('unPublished')==productItem.status
 // 获取列表
 PRODUCT_STATUS.data.map(d=><Select.Option value={d.value}>{d.text}</Select.Option>)
 // 获取某项
 PRODUCT_STATUS.map.get(1)或PRODUCT_STATUS.map.get('Published')
```