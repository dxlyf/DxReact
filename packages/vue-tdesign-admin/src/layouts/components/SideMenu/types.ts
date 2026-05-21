export interface MenuItem {
  path?: string
  menuKey?: string
  menuName?: string
  hideMenu?: boolean
  icon?: string
  parentKeys?: string[]
  children?: MenuItem[]
  permission?: string | string[]
}
