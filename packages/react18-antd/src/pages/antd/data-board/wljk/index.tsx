import {useMemo,useLayoutEffect,useCallback, useState, useEffect} from 'react'
import styles from './index.module.scss'
import { Card,Col,Skeleton , Row,Space,Typography,Descriptions, Select, DatePicker, Radio, Button, Spin} from 'antd'
import classNames from 'classnames'
import WLTJChart from './WLTJChart'
import { ShouldRender } from 'src/hooks/useShouldRender2'
import WLTJList from './WLTJList'
import useCallbacks from 'src/hooks/useCallbacks'
import {ExportOutlined,RedoOutlined} from '@ant-design/icons'
import YearQuarterMonthSelect from './YearMonthSelect'
import useAnimation,{CubicBezierSolver} from 'src/hooks/useAnimation'

function useScale(designWidth,designHeight) {
  const [scale, setScale] = useState(1);
  
  useEffect(() => {
    const updateScale = () => {
    //   const designWidth = 1920;
    //   const designHeight = 1080;
      const minWidth = 1280;
      const minHeight = 720;
      
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // 计算宽度和高度比例，取较小值
      const widthScale = windowWidth / designWidth;
      const heightScale = windowHeight / designHeight;
      
      let newScale = Math.min(widthScale, heightScale);
      
      // 设置最小缩放限制
      const minScale = Math.min(minWidth / designWidth, minHeight / designHeight);
      newScale = Math.max(newScale, minScale);
      
      setScale(newScale);
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    
    return () => window.removeEventListener('resize', updateScale);
  }, []);
  
  return scale;
}

function FangWuCard(props:any){

    return  <div className={classNames(styles.box,styles.cursor)} onClick={()=>{

    }}>
        <div className={styles.boxTitle}>房屋工程部</div>
        <div className={styles.boxContent}>
            <div className={styles.boxSubTitle}>
                <span>20</span>
                <span>宗</span>
            </div>
            <div className={styles.boxItem}>
                <div className={styles.boxControl}>
                    <label>安全违例</label>
                    <span>10</span>
                    <label>宗</label>
                </div>
                 <div className={styles.boxControl}>
                    <label>环保违例</label>
                    <span>10</span>
                    <label>宗</label>
                </div>
            </div>
              <div className={styles.boxItem}>
                <div className={styles.boxControl}>
                    <label>蚊虫违例</label>
                    <span>10</span>
                    <label>宗</label>
                </div>

            </div>
        </div>
    </div>
}
let a=new CubicBezierSolver(0.9,0.8,1,1)
const AnimationPlaceholder=({from,to,delay=0,duration=3000,children}:{from:any,to:any,duration?:number,delay?:number,children:(props:any)=>React.ReactNode})=>{
    const [props,animation]=useAnimation({
        from,
        to,
    },{
        delay,
        duration,
        easing:(t)=>a.solve(t)
    })
    return children(props)
}
export default function Wljk(){
  //  const scale=useScale(1648,720)
    const [tabKey,setTabKey] = useState('a')

    useLayoutEffect(()=>{
        document.body.classList.add(styles.bodyBg)
        return ()=>{

            document.body.classList.remove(styles.bodyBg)
        }
    },[])
    const callbacks=useCallbacks(['onExport'] as const)
    const renderTabContent=()=>{
        if(tabKey==='a'){
            return <WLTJChart></WLTJChart>
        }
        return <WLTJList callbacks={callbacks}></WLTJList>
    }
    return <div className={styles.page} >
        <div className={styles.wrap} >
            <div className={classNames(styles.head)}>
            <div className={styles.headContent}>
                <Row className={styles.toolbar} justify={'space-between'}>
                <Col flex={'auto'}>
                <span className={styles.subTitle}>中建香港</span>
                <span className={styles.subText}> 总数量：<AnimationPlaceholder from={{count:0}} to={{count:30}}>{(props)=>parseInt(props.count)}</AnimationPlaceholder>宗&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;安全违例：10宗&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;环保违例：5宗</span>
                </Col>
                <Col flex={'none'}>
                    <YearQuarterMonthSelect></YearQuarterMonthSelect>
                </Col>
            </Row>
            <div className={styles.boxWrap}>
                <FangWuCard></FangWuCard>
                <FangWuCard></FangWuCard>
                <FangWuCard></FangWuCard>
                <FangWuCard></FangWuCard>
                <FangWuCard></FangWuCard>
            </div>
            <div className={styles.updateTime}>数据统计规则：以上违例数据均按事发日期统计&nbsp;&nbsp;数据更新时间：2025-10-28 06:00:00</div>
        
            </div>
        </div>
        <div className={styles.mainContentBox}>
            <Row>
                <Col flex={'auto'}>
                    <Radio.Group className={styles.btnTab} buttonStyle='solid' value={tabKey} onChange={(e)=>{setTabKey(e.target.value)}}>
                         <Radio.Button value='a'>违例检控统计图</Radio.Button>
                         <Radio.Button value='b'>违例检控统计列表</Radio.Button>
                    </Radio.Group>
                </Col>
                <Col flex={'none'}>
                    {tabKey==='b'&&<Button icon={<ExportOutlined></ExportOutlined>}>导出数据</Button>}
                </Col>
            </Row>
            <div style={{marginTop:16}}>
                {renderTabContent()}
            </div>
        </div>
    </div>
    </div>
}