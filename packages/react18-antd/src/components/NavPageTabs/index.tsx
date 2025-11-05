/*
@desc 页面导航菜单标签
**/
import {useLayoutEffect,useCallback,useMemo,useContext, useState,useRef, useEffect} from 'react'
import {useOutlet,useLocation,matchPath,useNavigate, Outlet} from 'react-router-dom'
import {Tabs,Dropdown,type DropDownProps,type TabsProps, Button} from 'antd'
import classNames from 'classnames'
import {RouteContext} from '@ant-design/pro-components'
import {MoreOutlined} from '@ant-design/icons'
import styles from './index.module.scss'
import { NavBreadcrumb } from './NavBreadcrumb'

export type EnhanceNavTabsProps={
    closeLastNavUrl?:string // 关闭最后一个导航路径
    maxOpenTabCount?:number // 最大打开的标签数量,默认10个
}
const EnhanceNavTabItem=(props:React.PropsWithChildren<{}>)=>{
    const {children}=props
    const tabOparationItems=useMemo(()=>[
        {
            label:'关闭到左边',
            key:'closeLeft'
        },{
            label:'关闭到右边',
            key:'closeRight'
        },{
            label:'关闭其它',
            key:'closeOther'
        }
    ],[])
    return <>
    <Dropdown trigger={['contextMenu','click']} menu={{items:tabOparationItems}}><>{children}</></Dropdown>
    </>
}
 const PageNavTabs=(props:EnhanceNavTabsProps)=>{
    const {maxOpenTabCount=10,closeLastNavUrl="/"}=props
    const children=useOutlet()
    const nav=useNavigate()
    const {matchMenus,currentMenu}=useContext(RouteContext)
    
    const location=useLocation()
    const currentPagePath=location.pathname+''+location.search
    const [activeKey,setActiveKey]=useState<string|undefined>(undefined)
    const [items,setItems]=useState<NonNullable<TabsProps['items']>>([])

    const handleCloseOther = useCallback(() => {
        setItems(items => items.filter(d => d.key === activeKey));
    }, [activeKey]);
    const handleEdit=useCallback((key:any,action:string)=>{
        if(action==='remove'){
            const newItems=items.filter(d=>d.key!==key)
            setItems(newItems)
            if(newItems.length){
                nav(newItems[newItems.length-1].key)
            }else{
                nav(closeLastNavUrl)
            }
        }
    },[items,closeLastNavUrl])
    const handleChange = useCallback((newActiveKey:string) => {
         if (newActiveKey !== activeKey) {
            setActiveKey(newActiveKey);
            nav(newActiveKey);
         }
    }, [activeKey]);

    const renderAddIcon=useMemo(()=>{
        return <Dropdown className={styles.tabOparation} menu={{items:[{
            key:'closeOther',
            label:'关闭其它',
            onClick:handleCloseOther
        }]}} trigger={['click']} >
       <div className={styles.tabOparationCon}><MoreOutlined></MoreOutlined></div>
    </Dropdown>
    },[handleCloseOther])
    const newMatchMenus= useMemo(()=>{
        let set=new Set([])
        return matchMenus.filter(d=>{      
           if(!set.has(d.path)){
               set.add(d.path)
               return true
           }
           return false
        })
    },[matchMenus])
  
    const isHome=location.pathname==='/'
    const isMatch=currentMenu&&currentMenu.path&&matchPath(currentMenu,currentPagePath)
    let ref=useRef<NonNullable<TabsProps['items']>>(null);
    ref.current=items;
    useEffect(()=>{
            if(isHome){
                return
            }
            const exsitItem=ref.current.find(d=>d.key===currentPagePath)
            
            if(!exsitItem&&isMatch){
                setItems(ref.current.concat([{key:currentPagePath,label:currentMenu.name,children:children}].slice(-maxOpenTabCount)))
                setActiveKey(currentPagePath)
            }else if(exsitItem&&activeKey!==exsitItem.key){
                setActiveKey(exsitItem.key)
            }

    },[currentPagePath])

    if(!isMatch||isHome){
        return children
    }
    return <div className={classNames(styles.navTabs)}>
            <Tabs tabBarExtraContent={{left:<NavBreadcrumb items={newMatchMenus||[]}></NavBreadcrumb>}} type='editable-card'  addIcon={renderAddIcon} activeKey={activeKey} items={items} onChange={handleChange} onEdit={handleEdit}></Tabs>
        </div>
}
export default PageNavTabs