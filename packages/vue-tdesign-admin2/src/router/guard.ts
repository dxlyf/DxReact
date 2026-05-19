import type { Router } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { useTenantStore } from '@/store/tenant'
import { usePermissionStore } from '@/store/permission'
import { isUserInTenant } from '@/utils/tenant'

export function setupRouterGuard(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore()
    const tenantStore = useTenantStore()
    const permissionStore = usePermissionStore()

    const isLoggedIn = authStore.isLoggedIn

    if (to.meta.public) {
      if (isLoggedIn && to.name === 'Login') {
        return next({ name: 'Dashboard' })
      }
      return next()
    }

    if (!isLoggedIn) {
      return next({ name: 'Login', query: { redirect: to.fullPath } })
    }

    if (to.meta.requiresSuperAdmin && !authStore.isSuperAdmin) {
      return next({ name: 'Forbidden' })
    }

    if (to.meta.requiresTenant) {
      if (!tenantStore.currentTenantId) {
        if (authStore.user?.tenants && authStore.user.tenants.length > 1) {
          return next({ name: 'SelectTenant' })
        }
        if (authStore.user?.tenants?.length === 1) {
          tenantStore.setCurrentTenant(authStore.user.tenants[0])
        } else {
          return next({ name: 'Forbidden' })
        }
      }

      if (authStore.user && tenantStore.currentTenantId && !isUserInTenant(authStore.user, tenantStore.currentTenantId)) {
        return next({ name: 'Forbidden' })
      }
    }

    if (!authStore.permissionsLoaded) {
      const tenantId = tenantStore.currentTenantId
      if (tenantId) {
        await permissionStore.fetchMenus(tenantId)
        authStore.permissionsLoaded = true
      }
    }

    next()
  })
}
