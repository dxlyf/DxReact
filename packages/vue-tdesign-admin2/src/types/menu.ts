export interface MenuItem {
  id: string
  parentId: string | null
  name: string
  path: string
  title: string
  icon?: string
  component?: string
  permission?: string
  hidden: boolean
  keepAlive: boolean
  order: number
  children?: MenuItem[]
}
