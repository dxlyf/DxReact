# NewAdminLayout.vue 实现计划

## 需求概述

在 `Layouts` 目录创建 `NewAdminLayout.vue` 组件，实现：

* 顶部导航

* 左侧可收缩菜单

* 右侧页面内容区

* 菜单数据动态从 `NewMenuStore` 读取

* 菜单权限控制

* 子菜单支持

* 菜单选中状态持久化（如：从列表页跳到编辑页，保持列表选中）

* 页签支持

***

## 实现步骤

### 1. 创建 NewMenuStore (stores/newMenu.ts)

**位置**: `e:\fanyonglong\projects\private\DxReact\packages\vue-tdesign-admin\src\stores\newMenu.ts`

**状态管理**:

* `menuData`: 菜单数据（从路由过滤后）

* `collapsed`: 左侧菜单栏折叠/展开状态

* `activeMenuKey`: 当前选中的菜单键

* `expandedKeys`: 展开的菜单键数组（支持多个展开）

* `tabs`: 已打开的页签列表

* `activeTab`: 当前活动的页签

**方法**:

* `setCollapsed(collapsed: boolean)`: 设置折叠状态

* `setActiveMenuKey(key: string)`: 设置选中菜单

* `toggleExpanded(key: string)`: 切换单个菜单项展开/折叠

* `setExpandedKeys(keys: string[])`: 设置展开的菜单键数组

* `addTab(tab: TabItem)`: 添加页签

* `removeTab(path: string)`: 移除页签

* `setActiveTab(path: string)`: 设置活动页签

* `filterMenuByPermission()`: 根据权限过滤菜单

**权限控制**:

* 菜单项增加 `permission` 字段标识所需权限

* 根据用户权限动态过滤可显示的菜单

### 2. 创建 NewAdminLayout.vue (layouts/NewAdminLayout.vue)

**位置**: `e:\fanyonglong\projects\private\DxReact\packages\vue-tdesign-admin\src\layouts\NewAdminLayout.vue`

**布局结构**:

```
t-layout
├── t-aside (左侧菜单，可折叠)
│   └── t-menu
│       └── 递归渲染子菜单组件
├── t-layout (右侧)
│   ├── t-header (顶部导航)
│   │   ├── 折叠菜单按钮 (触发 store.collapsed)
│   │   ├── Logo/标题
│   │   └── 用户信息/设置
│   ├── tabs 区域 (页签)
│   │   ├── 显示 store.tabs
│   │   └── 切换/关闭页签
│   └── t-content (内容区)
│       └── router-view
```

**菜单选中状态持久化逻辑**:

* 编辑/新增页面路由的 `meta.menuKey` 指向父级菜单

* 路由变化时，根据 `meta.menuKey` 查找菜单项

* 若找不到匹配，将 `meta.parentMenuKey` 作为父级键

* 自动将该父级键加入 `expandedKeys` 实现菜单树自动展开

### 3. 实现菜单递归组件 (layouts/components/NewSideSubmenu.vue)

**功能**:

* 递归渲染多级菜单

* 支持 icon、title、children

* 权限过滤（根据 `permission` 字段）

* 监听点击事件调用 `NewMenuStore` 方法

### 4. 路由配置配合

**说明**:

* 编辑/新增页面路由需设置 `meta.menuKey` 或 `meta.parentMenuKey`

* 例如：`/user/edit/:id` 页面设置 `meta.menuKey: '/user/list'`

* 确保从列表页跳转到编辑页时，菜单保持列表项选中状态

***

## 关键文件清单

| 文件                                          | 操作 | 说明                        |
| ------------------------------------------- | -- | ------------------------- |
| `src/stores/newMenu.ts`                     | 新建 | NewMenuStore（含菜单状态、页签、权限） |
| `src/layouts/NewAdminLayout.vue`            | 新建 | 主布局组件                     |
| `src/layouts/components/NewSideSubmenu.vue` | 新建 | 递归菜单组件                    |

***

## 依赖项

* TDesign Vue Next 组件库 (`t-layout`, `t-menu`, `t-tabs` 等)

* Pinia 状态管理

* Vue Router

