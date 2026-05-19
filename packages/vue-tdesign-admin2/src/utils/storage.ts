export function getStorage<T = any>(key: string): T | null {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function setStorage(key: string, value: any): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function removeStorage(key: string): void {
  localStorage.removeItem(key)
}

export function clearAllTenantData(tenantId: string): void {
  const prefix = `tenant:${tenantId}:`
  Object.keys(localStorage)
    .filter(k => k.startsWith(prefix))
    .forEach(k => localStorage.removeItem(k))
}
