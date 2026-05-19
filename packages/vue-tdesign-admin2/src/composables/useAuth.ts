import { useAuthStore } from '@/store/auth'

export function useAuth() {
  const authStore = useAuthStore()

  return {
    isLoggedIn: computed(() => authStore.isLoggedIn),
    isSuperAdmin: computed(() => authStore.isSuperAdmin),
    user: computed(() => authStore.user),
    login: authStore.login.bind(authStore),
    logout: authStore.logout.bind(authStore),
    fetchUserInfo: authStore.fetchUserInfo.bind(authStore),
  }
}
