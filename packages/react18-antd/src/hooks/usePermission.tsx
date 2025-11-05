import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Permission } from '../types/permission';

// 模拟当前用户拥有的权限
const mockUserPermissions = [
  'menu-dashboard',
  'menu-users',
  'menu-roles',
  'btn-add',
  'btn-edit',
  'btn-view'
];

/**
 * 权限控制hook，用于检查用户是否拥有特定权限
 * @param permissions 用户拥有的权限列表（实际应用中应从用户状态或API获取）
 */
export function usePermission() {
  const [permissions,setPermissions]=useState<string[]>([])
  // 检查是否拥有指定权限
  const hasPermission = useCallback((permissionCode: string): boolean => {
      return permissions.includes(permissionCode);
    }, [permissions]);

  // 检查是否拥有多个权限中的至少一个
  const hasAnyPermission = useCallback((permissionCodes: string|string[]): boolean => {
      if(!Array.isArray(permissionCodes)){
          permissionCodes=[permissionCodes]
      }
      return (permissionCodes as string[]).some(code => permissions.includes(code));
  }, [permissions]);

  // 检查是否拥有所有指定权限
  const hasAllPermissions = useMemo(() => {
    return (permissionCodes: string|string[]): boolean => {
      if(!Array.isArray(permissionCodes)){
          permissionCodes=[permissionCodes]
      }
      return permissionCodes.every(code => permissions.includes(code));
    };
  }, [permissions]);

  // 过滤菜单，只返回用户有权限的菜单
  const filterMenuByPermission = useMemo(() => {
    return (menuItems: any[]): any[] => {
      return menuItems
        .filter(item => {
          // 检查菜单项是否有权限码，以及用户是否拥有该权限
          if (item.permission && !permissions.includes(item.permission)) {
            return false;
          }
          return true;
        })
        .map(item => ({
          ...item,
          // 递归过滤子菜单
          children: item.children ? filterMenuByPermission(item.children) : undefined
        }))
        .filter(item => {
          // 移除没有子项的父菜单
          if (item.children && item.children.length === 0) {
            delete item.children;
          }
          return true;
        });
    };
  }, [permissions]);
  useEffect(()=>{
    setPermissions(mockUserPermissions)
  },[])
  // 返回hook结果
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    filterMenuByPermission,
    permissions
  };
}

/**
 * 权限检查组件，根据权限条件渲染子组件
 */
export function PermissionGate({
  permissions,
  children,
  fallback = null,
  mode = 'any' // 'all' 需要所有权限，'any' 需要任一权限
}: {
  permissions: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mode?: 'all' | 'any';
}) {
  const { hasAllPermissions, hasAnyPermission } = usePermission();
  const hasAccess = mode === 'all' 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  return hasAccess ? <>{children}</> : fallback;
}