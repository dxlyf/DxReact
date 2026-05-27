export type MenuItem = {
    menuKey: string
    path?: string

    name: string
    icon?: string
    relativePath?: string[]
    parentKeys?: string[]
    children?: MenuItem[]
}