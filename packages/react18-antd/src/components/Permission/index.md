# React + TypeScript 权限控制系统设计与实现

我将为您设计一个完整的权限控制系统，支持页面级和按钮级的权限控制。这个系统将包含权限管理、路由守卫和权限指令等功能。

## 设计思路

1. **权限数据结构**：定义用户权限和角色
2. **权限上下文**：使用React Context全局管理权限状态
3. **路由守卫**：控制页面访问权限
4. **权限指令**：控制按钮/组件的显示权限
5. **权限管理**：提供权限检查和更新方法

下面是完整的实现代码：

```tsx
// PermissionSystem.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ========== 类型定义 ==========

// 权限类型
export type Permission = string;

// 角色类型
export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

// 用户类型
export interface User {
  id: string;
  username: string;
  roles: Role[];
}

// 权限上下文类型
interface PermissionContextType {
  user: User | null;
  permissions: Permission[];
  hasPermission: (permission: Permission | Permission[]) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  updateUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

// ========== 权限上下文 ==========

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// ========== 权限提供者 ==========

interface PermissionProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ 
  children, 
  initialUser = null 
}) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(true);

  // 从用户信息中提取所有权限
  const permissions = user 
    ? user.roles.flatMap(role => role.permissions)
    : [];

  // 检查是否拥有特定权限
  const hasPermission = (permission: Permission | Permission[]): boolean => {
    if (!user) return false;
    
    if (Array.isArray(permission)) {
      return permission.every(p => permissions.includes(p));
    }
    
    return permissions.includes(permission);
  };

  // 检查是否拥有任意一个权限
  const hasAnyPermission = (permissionsToCheck: Permission[]): boolean => {
    if (!user) return false;
    return permissionsToCheck.some(p => permissions.includes(p));
  };

  // 更新用户信息
  const updateUser = (newUser: User | null) => {
    setUser(newUser);
  };

  // 登录
  const login = (userData: User) => {
    setUser(userData);
    // 在实际应用中，这里应该将用户信息存储到本地存储或cookie中
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // 登出
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // 初始化时从本地存储加载用户信息
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user data:', error);
      }
    }
    setIsLoading(false);
  }, []);

  const value: PermissionContextType = {
    user,
    permissions,
    hasPermission,
    hasAnyPermission,
    updateUser,
    login,
    logout,
    isLoading
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

// ========== 权限Hook ==========

export const usePermission = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
};

// ========== 权限高阶组件 ==========

interface WithPermissionProps {
  permission: Permission | Permission[];
  fallback?: ReactNode;
}

export const withPermission = <P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission | Permission[],
  fallback: ReactNode = null
): React.FC<P> => {
  const WrappedComponent: React.FC<P> = (props) => {
    const { hasPermission } = usePermission();
    
    if (hasPermission(permission)) {
      return <Component {...props} />;
    }
    
    return <>{fallback}</>;
  };
  
  return WrappedComponent;
};

// ========== 权限组件 ==========

interface PermissionProps {
  permission: Permission | Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}

// 权限控制组件
export const Permission: React.FC<PermissionProps> = ({ 
  permission, 
  fallback = null, 
  children 
}) => {
  const { hasPermission } = usePermission();
  
  if (hasPermission(permission)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

// 任意权限控制组件
interface AnyPermissionProps {
  permissions: Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}

export const AnyPermission: React.FC<AnyPermissionProps> = ({ 
  permissions, 
  fallback = null, 
  children 
}) => {
  const { hasAnyPermission } = usePermission();
  
  if (hasAnyPermission(permissions)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

// ========== 路由守卫 ==========

import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  permission?: Permission | Permission[];
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  permission, 
  children, 
  fallback = <Navigate to="/login" replace />
}) => {
  const { user, hasPermission, isLoading } = usePermission();
  const location = useLocation();

  if (isLoading) {
    // 可以在这里显示加载指示器
    return <div>Loading...</div>;
  }

  // 如果没有登录，重定向到登录页
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 如果指定了权限但用户没有权限，显示fallback
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ========== 示例使用 ==========

// 定义权限常量
export const PERMISSIONS = {
  // 页面权限
  DASHBOARD_VIEW: 'dashboard:view',
  USER_MANAGEMENT_VIEW: 'user:view',
  SETTINGS_VIEW: 'settings:view',
  
  // 按钮/操作权限
  USER_CREATE: 'user:create',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  USER_EXPORT: 'user:export',
  
  // 其他权限
  ADMIN_PANEL: 'admin:panel',
  REPORTS_VIEW: 'reports:view',
} as const;

// 示例用户数据
export const createExampleUser = (role: 'admin' | 'user' | 'viewer'): User => {
  const roles: Record<string, Role> = {
    admin: {
      id: '1',
      name: 'Administrator',
      permissions: Object.values(PERMISSIONS)
    },
    user: {
      id: '2',
      name: 'User',
      permissions: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.USER_MANAGEMENT_VIEW,
        PERMISSIONS.USER_CREATE,
        PERMISSIONS.USER_EDIT,
      ]
    },
    viewer: {
      id: '3',
      name: 'Viewer',
      permissions: [
        PERMISSIONS.DASHBOARD_VIEW,
      ]
    }
  };

  return {
    id: '1',
    username: `${role}@example.com`,
    roles: [roles[role]]
  };
};

// 示例组件
export const DashboardPage: React.FC = () => {
  const { user, hasPermission } = usePermission();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.username}</p>
      
      {/* 使用Permission组件控制按钮显示 */}
      <Permission 
        permission={PERMISSIONS.USER_CREATE}
        fallback={<button disabled>Create User (No Permission)</button>}
      >
        <button>Create User</button>
      </Permission>
      
      <Permission permission={PERMISSIONS.USER_EDIT}>
        <button>Edit User</button>
      </Permission>
      
      <Permission permission={PERMISSIONS.USER_DELETE}>
        <button>Delete User</button>
      </Permission>
      
      {/* 使用AnyPermission组件 */}
      <AnyPermission permissions={[PERMISSIONS.USER_EXPORT, PERMISSIONS.ADMIN_PANEL]}>
        <button>Export Data</button>
      </AnyPermission>
    </div>
  );
};

// 使用高阶组件的示例
const AdminPanel: React.FC = () => {
  return <div>Admin Panel - Only for administrators</div>;
};

const AdminPanelWithPermission = withPermission(
  AdminPanel, 
  PERMISSIONS.ADMIN_PANEL,
  <div>You don't have permission to access the admin panel</div>
);

// 登录组件示例
export const LoginPage: React.FC = () => {
  const { login } = usePermission();
  
  const handleLogin = (role: 'admin' | 'user' | 'viewer') => {
    login(createExampleUser(role));
  };

  return (
    <div>
      <h1>Login</h1>
      <button onClick={() => handleLogin('admin')}>Login as Admin</button>
      <button onClick={() => handleLogin('user')}>Login as User</button>
      <button onClick={() => handleLogin('viewer')}>Login as Viewer</button>
    </div>
  );
};

// 主应用组件示例
export const App: React.FC = () => {
  return (
    <PermissionProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute permission={PERMISSIONS.DASHBOARD_VIEW}>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute permission={PERMISSIONS.ADMIN_PANEL}>
                <AdminPanelWithPermission />
              </ProtectedRoute>
            } 
          />
          {/* 其他路由 */}
        </Routes>
      </Router>
    </PermissionProvider>
  );
};

export default PermissionSystem;
```

## 使用说明

### 1. 设置权限提供者

在应用根组件中包裹 `PermissionProvider`：

```tsx
import { PermissionProvider } from './PermissionSystem';

const RootApp: React.FC = () => {
  return (
    <PermissionProvider>
      <YourApp />
    </PermissionProvider>
  );
};
```

### 2. 保护路由

使用 `ProtectedRoute` 组件保护需要权限的页面：

```tsx
<ProtectedRoute permission={PERMISSIONS.DASHBOARD_VIEW}>
  <DashboardPage />
</ProtectedRoute>
```

### 3. 控制按钮权限

使用 `Permission` 组件控制按钮显示：

```tsx
<Permission 
  permission={PERMISSIONS.USER_CREATE}
  fallback={<button disabled>No Permission</button>}
>
  <button>Create User</button>
</Permission>
```

### 4. 使用权限Hook

在组件内部使用 `usePermission` Hook：

```tsx
const { hasPermission, user } = usePermission();

if (hasPermission(PERMISSIONS.USER_EDIT)) {
  // 执行需要权限的操作
}
```

## 特性

- ✅ **TypeScript 支持**：完整的类型定义
- ✅ **页面级权限控制**：通过路由守卫实现
- ✅ **按钮级权限控制**：通过权限组件实现
- ✅ **多种权限检查方式**：单个权限、多个权限、任意权限
- ✅ **持久化**：自动保存用户登录状态
- ✅ **灵活的回退机制**：支持自定义无权限时的显示内容
- ✅ **高阶组件支持**：用于包装现有组件

这个权限控制系统提供了完整的解决方案，可以根据您的具体需求进行调整和扩展。