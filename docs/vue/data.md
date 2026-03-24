
## 主要术语

### 1. **数据映射 (Data Mapping)**
最常用的说法，指将前端表单数据结构转换为后端接口所需的数据结构。

```typescript
// 前端表单数据
const formData = {
  userName: '张三',
  userAge: 25,
  userEmail: 'zhang@example.com'
}

// 映射为接口数据
const apiData = {
  name: formData.userName,
  age: formData.userAge,
  email: formData.userEmail
}
```

### 2. **数据适配 (Data Adaptation)**
强调适配层的作用，使前后端数据结构匹配。

### 3. **数据转换 (Data Transformation)**
泛指数据结构的变化过程。

### 4. **序列化/反序列化 (Serialization/Deserialization)**
当涉及数据类型转换时使用，比如日期、枚举值等。

## 常见实现模式

### 1. **DTO (Data Transfer Object)**
```typescript
// 表单VO (View Object)
interface UserFormVO {
  userName: string;
  userAge: number;
  birthDate: Date;
}

// 接口DTO (Data Transfer Object)
interface UserAPIDTO {
  name: string;
  age: number;
  birthday: string; // 后端需要字符串格式
}

// 转换函数
function transformToDTO(form: UserFormVO): UserAPIDTO {
  return {
    name: form.userName,
    age: form.userAge,
    birthday: formatDate(form.birthDate, 'YYYY-MM-DD')
  }
}
```

### 2. **Adapter模式**
```typescript
class UserFormAdapter {
  static toAPI(formData: UserForm): UserAPI {
    return {
      // 字段重命名
      full_name: formData.name,
      // 类型转换
      age: Number(formData.age),
      // 数据格式化
      created_at: new Date().toISOString()
    }
  }
  
  static toForm(apiData: UserAPI): UserForm {
    // 反向转换
  }
}
```

### 3. **Interceptor/Transform层**
```typescript
// 请求拦截器中进行转换
axios.interceptors.request.use(config => {
  if (config.data && config.transformKeys) {
    config.data = transformKeys(config.data, 'camelToSnake');
  }
  return config;
})
```

## 专业术语总结

| 术语 | 说明 | 使用场景 |
|------|------|---------|
| **数据映射** | 最通用，字段名和结构转换 | 前后端字段名不一致 |
| **数据适配** | 强调接口适配 | 对接多个后端接口 |
| **数据清洗** | 去除无用字段、格式化 | 提交前的预处理 |
| **数据归一化** | 统一数据格式 | 多源数据整合 |
| **契约转换** | 按接口契约转换 | 严格的API规范 |

## 在项目中的常见做法

```typescript
// 1. 单独建一个转换函数文件
// utils/transform.ts
export function transformFormToAPI(formData: any) {
  return {
    // 字段映射
    id: formData.userId,
    name: formData.username,
    // 值转换
    status: formData.active ? 1 : 0,
    // 数据组装
    fullInfo: `${formData.name}-${formData.age}`
  }
}

// 2. 在提交前调用
async function handleSubmit() {
  const apiData = transformFormToAPI(formData);
  await submitAPI(apiData);
}
```

这个步骤在前端架构中非常重要，通常被称为**数据映射层**或**适配层**，是前后端解耦的关键环节。