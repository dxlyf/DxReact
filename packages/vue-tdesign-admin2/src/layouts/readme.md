### 1. DefaultLayout.vue — 默认布局（侧边栏 + 顶栏）
最常见的布局，左右分栏或上下分栏，包含侧边栏菜单、顶部导航栏、内容区。

### 2. BlankLayout.vue — 空白布局
不带任何侧边栏和顶栏，通常用于登录页、注册页、404 错误页等独立页面。

### 3. FullLayout.vue — 全宽布局（顶部导航）
菜单放在顶部，没有侧边栏，内容区全宽显示，适合菜单项较少的场景。

### 4. MixLayout.vue — 混合布局
顶部放一级菜单，侧边栏放二级/三级菜单，适合菜单层级深、数量多的复杂后台。

### 5. IframeLayout.vue — 嵌套布局（可选）
用于内嵌第三方系统页面，用 <iframe> 嵌入外部链接。

### 6. TabLayout.vue — 标签页布局（可选）
内容区上方增加多标签页导航，支持多页面切换缓存。

src/layouts/
├── BlankLayout.vue      # 空布局（登录/错误页用）
├── DefaultLayout.vue    # 默认布局（主框架）
├── MixLayout.vue        # 混合布局（可选）
├── components/          # 布局内部拆分的子组件
│   ├── Header.vue       # 顶部栏
│   ├── Sidebar.vue      # 侧边栏
│   ├── TagsBar.vue      # 标签页（tab 布局用）
│   ├── Breadcrumb.vue   # 面包屑
│   └── Footer.vue       # 底部