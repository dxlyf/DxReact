// 权限类型定义
export interface Permission {
  id: string;
  name: string;
  code: string;
  type: 'menu' | 'button';
  parentId?: string;
  path?: string;
  icon?: string;
}

// 角色类型定义
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[]; // 权限ID列表
  createdAt: string;
  updatedAt: string;
}

// 菜单类型定义
export interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon?: string;
  children?: MenuItem[];
  permissions?: string[];
}