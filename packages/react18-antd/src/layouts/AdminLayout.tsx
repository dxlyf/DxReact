import { ProLayout, getMenuData} from '@ant-design/pro-components'
import { useEffect, useMemo, useRef, useState } from 'react'
import { routes } from 'src/routes/routes'
import { NavLink, useOutlet, Outlet, useLocation, useMatch } from 'react-router-dom'
import { Tabs } from 'antd'
import PageNavTabs from 'src/components/NavPageTabs'

export const AdminLayout = () => {
    const { pathname } = useLocation()
    const menuData = useMemo(() => getMenuData(routes), [routes])
    const [menuState, setMenuState] = useState(() => {
        const state: { menuKeys: string[], navItems: any[] } = {
            menuKeys: [],
            navItems: []
        }
        state.menuKeys.push(pathname)
        return state
    })
    const match = useMatch(location.pathname)

    useEffect(() => {

    }, [])


    return <ProLayout className='adminLayout' location={location}  title='Demo'
        menuDataRender={() => menuData.menuData}
        menuItemRender={(item, defaultDom) => {
            if (!item.path) {
                return defaultDom
            }
            return <NavLink to={item.path!}>
                {defaultDom}
            </NavLink>
        }}
    >
        <PageNavTabs></PageNavTabs>
    </ProLayout>
} 