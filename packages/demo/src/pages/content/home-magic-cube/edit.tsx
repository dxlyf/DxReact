/**
 * 首页魔方-编辑
 * @author fanyonglong
 */
import React, { useCallback, useEffect, useState, Component, useRef, useMemo,useLayoutEffect} from 'react';
import {
  Form,
  Card,
  DatePicker,
  Space,
  Radio,
  Input,
  Select,
  Button,
  message,
  Row,
  Col,
  InputNumber,
  Slider
} from 'antd';
import { CloseCircleFilled } from '@ant-design/icons';
import { UploadImage, useUplaodImage } from '@/components/Upload';
import { ADVERTISE_URL_TYPES } from '@/common/constants/advertisement';
import * as contentService from '@/services/content';
import * as diyService from '@/services/diy';
import moment from 'moment';
import { omit, uniqueId } from 'lodash';
import { transformFilesToUrls, normalizeFile } from '@/utils/util';
import styles from './index.module.less'
import { templates } from './cube-config'
import app from '@/utils/app'
import {useUpdate} from 'ahooks'
import {useStateCallback} from '@/common/hooks'

const formLayout = {
  wrapperCol: {
    xxl: { span: 10 },
    xl: { span: 10 },
    lg: { span: 10 },
    md: { span: 10 },
  },
  labelCol: {
    xxl: { span: 3 },
    xl: { span: 2 },
    lg: { span: 4 },
    md: { span: 6 },
  },
};

function validator(state) {
  const {
    rects,
    imgs,
    urlTypes,
    adviceUrls
  } = state
  if (!imgs.length) {
    return {
      type: 'error',
      message: '请至少选择一张背景图'
    }
  }
  if (imgs.filter(Boolean).length !== rects.length) {
    return {
      type: 'error',
      message: '请继续添加图片'
    }
  }
  if (urlTypes.filter(d=>d!=undefined&&d!==null).length !== rects.length) {
    return {
      type: 'error',
      message: '存在布局链接类型未填写，请检查'
    }
  } else {
    let validateSucc = true
    for (var i = 0;i < urlTypes.length;i++) {
      if (urlTypes[i] != ADVERTISE_URL_TYPES.enums.value0.value && !adviceUrls[i]) {
        validateSucc = false
        break
      }
    }
    if (!validateSucc) {
      return {
        type: 'error',
        message: '存在布局链接值未填写，请检查'
      }
    }
  }

}



let MagicCubeEditor: React.FC<any> = (props) => {

  let id = props.match?.params.id;
  let {history}=props
  let instance = useRef<any>({col:1,startTile:null,tileRefs:{}}).current
  let [loading, setLoading] = useState(false);
  let [form] = Form.useForm();
  let forceUpdate=useUpdate()
  let [themeList, setThemeList] = useState([])
  let [state, setState] = useStateCallback(() => {
    let templateType = 1
    return {
      col:1,
      templateType:templateType,
      // 容器宽度
      designWidth: 375,
      rects: [],
      currentTemplate: templates.find(item => item.type === templateType),
      containerHeight:0,
      // 默认激活第一个方块区域，
      // 这个参数只有在非`自定义魔方`的情况才有效
      activeRectIndex: 0,
      /**
       * 自定义魔方格子数组
       * 4x4的结果如下：
       * [
       *  [o, o, o, o],
       *  [o, o, o, o],
       *  [o, o, o, o],
       *  [o, o, o, o],
       * ]
       * 其它密度以此类推
       */
      tileSeed: [],
      imgMargin: 0,

      // 用户选择的图片
      imgs: [],
      // orgId: '',
      urlTypes: [],
      adviceUrls: []
    }
  })

  let handleUrlChange = useCallback(value => {
      let newAdviceUrls = [...state.adviceUrls]
      newAdviceUrls[state.activeRectIndex] = value
      setState((prevState)=>({
        ...prevState,
        adviceUrls: newAdviceUrls,
      }))
 
  },[state])
  let renderUrlType = useCallback(
    (urlType,adviceUrl) => {
      if (urlType === ADVERTISE_URL_TYPES.enums.value0.value||!urlType) {
        return null;
      } else if (urlType === ADVERTISE_URL_TYPES.enums.value2.value) {
        return (
          <Form.Item style={{ marginTop: 15 }}>
            <Select value={adviceUrl} placeholder="请选择主题" onChange={(value)=>{
                handleUrlChange(value)
            }}>
              {themeList.map((d) => (
                <Select.Option key={d.id} value={d.id}>
                  {d.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        );
      } else {
        return (
          <Form.Item>
            <Input value={adviceUrl} placeholder="请输入链接" onChange={(e)=>{
              handleUrlChange(e.target.value)
            }}></Input>
          </Form.Item>
        );
      }
    },
    [themeList,handleUrlChange],
  );
  
  let hitTest=(a, b)=> {
    // 2为border值
    return !(
      a.left + a.width <= b.left ||
      b.left + b.width <= a.left ||
      a.top + a.height <= b.top ||
      b.top + b.height <= a.top
    )
  }
  // 开始绘制一个虚拟的矩形
  let createTempRect=(overTile)=> {
    const { x: x1, y: y1 } = instance.startTile
    const { x: x2, y: y2 } = overTile

    const w = Math.abs(y1 - y2)
    const h = Math.abs(x1 - x2)
    const sx = Math.min(y1, y2)
    const sy = Math.min(x1, x2)
    const ex = w === 0 ? 1 : w + 1
    const ey = h === 0 ? 1 : h + 1

    const tempRect = {
      top: sy,
      left: sx,
      width: ex,
      height: ey
    }

    const isHit = state.rects.some(rect => hitTest(rect, tempRect))
    if (!isHit) {
      paintTiles(tempRect)
      forceUpdate()
    }
  }
  // 完成绘制矩形
  let completedTempRect=()=> {
    let topList = []
    let leftList = []

    state.tileSeed.forEach(row => {
      row.forEach(item => {
        if (item.active) {
          const { top, left } = item
          topList.push(+top)
          leftList.push(+left)
        }
      })
    })

    const top = Math.min(...topList)
    const left = Math.min(...leftList)
    const right = Math.max(...leftList) + 1
    const bottom = Math.max(...topList) + 1
    const width = Math.abs(left - right)
    const height = Math.abs(top - bottom)

    const rect = {
      top,
      left,
      width,
      height
    }
    setRectText(rect)
    let newRects = [...state.rects]
    newRects.push(rect)
    setState((prevState)=>({
      ...prevState,
      rects: newRects
    }))
 
  }

  let paintTiles=(tempRect)=> {
    state.tileSeed.forEach(row => {
      row.forEach(item => {
        const { top, left } =instance.tileRefs[item.id]
        item.active = hitTest(tempRect, {
          top: +top,
          left: +left,
          width: 1,
          height: 1
        })
      })
    })
  }

  let renderRectContent=(item, index)=>{
    const { imgs } = state
    if (imgs[index]) {
      return (
        <img
          // {...imgProps}
          className={styles.rectImg}
          src={app.toImageUrl(transformFilesToUrls(imgs[index])[0])}
          alt=""
        />
      )
    }
    return (
      <>
        {item.text.num}
        {item.text.numText}
        <div>{item.text.extra}</div>
      </>
    )
  }
  let handleDeleteRect = index => {
    let newRects = [...state.rects]
    let newImgs = [...state.imgs]
    let newUrlTypes = [...state.urlTypes]
    let newAdviceUrls = [...state.adviceUrls]
    newRects.splice(index, 1)
    newImgs.splice(index, 1)
    newUrlTypes.splice(index, 1)
    newAdviceUrls.splice(index, 1)
    setState((prevState)=>({
      ...prevState,
      rects: newRects,
      imgs: newImgs,
      urlTypes: newUrlTypes,
      adviceUrls: newAdviceUrls
    }))

   

    if (newRects.length) {
      newRects.forEach(item => {
        paintTiles(item)
      })
    } else {
      state.tileSeed.forEach(row => {
        row.forEach(item => {
          item.active = false
        })
      })
    }
    forceUpdate()
  }

  let renderRects=(maxHeight?:any)=> {
    const tileWidth = getTileWidth()
    return state.rects.map((item, index) => {
      // 1行2个，1行3个，1行4个没有高度值
      const height = item.height || item.width
      let cls = styles.rect
      if (state.activeRectIndex === index) {
        cls = cls + ' ' + styles.rectActive
      }
      return (
        <div
          key={index}
          className={cls}
          style={{
            top: item.top * tileWidth + item.top,
            left: item.left * tileWidth + item.left,
            width: item.width * tileWidth + item.width - 1,
            height: height * tileWidth + height - 1,
            maxHeight
          }}
          onClick={() => {
             setState((prevState)=>({...prevState,
              activeRectIndex: index
            }))
          }}
        >
          {state.currentTemplate.type === 'customize' ? (
            <CloseCircleFilled
              className={styles.icon}
              onClick={() => handleDeleteRect(index)}
            />
          ) : null}
          {renderRectContent(item, index)}
        </div>
      )
    })
  }
  let getTileWidth=()=>{
    const { designWidth } = state
    const tileWidth = (designWidth - 3) / instance.col
    return tileWidth
  }
  let handleTileClick = (x, y) => {
    if (instance.startTile) {
      instance.startTile = null
      completedTempRect()
    } else {
      instance.startTile = { x, y }
      createTempRect(instance.startTile)
    }
  }
  let handleTileMouseOver = (x, y) => {
    if (instance.startTile) {
        createTempRect({ x, y })
    }
  }
  // 渲染小方块
  let renderTiles=()=>{
    const width = getTileWidth()
    return state.tileSeed.map((row, y) => {
      return (
        <ul className={styles.tileRow} key={y}>
          {row.map((item, x) => {
            let clsName = ''
            if (item.active) {
              clsName += styles.active
            }
            instance.tileRefs[item.id].top=x
            instance.tileRefs[item.id].left=y
    
            return (
              <li
                key={item.id}
                className={`${styles.tile} ${clsName}`}
                style={{
                  width,
                  height: width
                }}
                onClick={() => handleTileClick(x, y)}
                onMouseEnter={() => handleTileMouseOver(x, y)}
              />
            )
          })}
        </ul>
      )
    })
  }
  let renderCurrentTemplate=()=>{
    if (state.currentTemplate.type === 'customize') {
      const containerHeight = getContainerHeight(state.rects)
      const style = { height: containerHeight }
      return (
        <div
          className={styles.layout}
          style={style}
        >
          {renderRects()}
          {renderTiles()}
        </div>
      )
    } else {
      const style = { height: state.containerHeight }
      return (
        <div className={styles.layout} style={style}>
          {renderRects(state.containerHeight)}
        </div>
      )
    }
  }
  let handlePhotoChange = fileList => {
    let newImgs = [...state.imgs]
    if (fileList.length) {
      newImgs[state.activeRectIndex] =[...fileList]
    } else {
      newImgs[state.activeRectIndex] = null
    }
    setState((prevState)=>({...prevState,imgs:newImgs}),(state)=>{
      instance.handleTemplateClick(state.currentTemplate)
    })
 
  }
  let onSaveUpdate = useCallback(
    (values: any) => {
      let msgInfo=validator(state)
      if (msgInfo) {
        message[msgInfo.type](msgInfo.message)
        if (msgInfo.type === 'error') {
          return
        }
      }
      let contentStyle={
    // 模版类型，默认显示`1行2个`模版
        templateType: state.templateType,
        rects: state.rects,
        containerHeight: state.containerHeight,
        /**
         * 选择完图片的时候，要根据选择的矩形下标index，
         * 然后用矩形下标index插入imgs数组的index
         */
        imgs:Array.isArray(state.imgs)?state.imgs.map((imgs)=>transformFilesToUrls(imgs)[0]):[],
        col: state.col,
        margin: state.imgMargin,
        urlTypes: state.urlTypes,
        adviceUrls: state.adviceUrls
      }
      let sumbitData:any={
         title:values.title,
         contentStyle:JSON.stringify(contentStyle)
      }
      if(id){
        sumbitData.id=id
        setLoading(true)
        contentService.updateMagicCube(sumbitData).then(()=>{
            message.success('保存成功!')
            setLoading(false)
            history.push('/content/home-magic-cube')
        }).catch(()=>{
          setLoading(false)
        })
      }else{
        setLoading(true)
        contentService.addMagicCube(sumbitData).then(()=>{
            message.success('保存成功!')
            setLoading(false)
            history.push('/content/home-magic-cube')
        }).catch(()=>{
          setLoading(false)
        })
      }
    },
    [id,state],
  );


  const getImgsFromState = useCallback(nextType => {
    let imgs
    if (nextType === 'customize') {
      if (state.currentTemplate.type === 'customize') {
        imgs = state.imgs
      } else {
        imgs = []
      }
    } else {
      if (state.currentTemplate.type === 'customize') {
        imgs = []
      } else {
        imgs = state.imgs
      }
    }
    setState((prevState) => ({ ...prevState, imgs: imgs }))
    return imgs
  }, [state])

  /**
   * 设置每个矩形上的提示文字
   * @param {Object} rect 矩形的位置宽高描述
   * @param {String} col // 密度值
   * @param {Number|Undefined} templateType // 模版type，用来判断是否前3个模版
   */
  const setRectText = useCallback((rect, templateType?:any) => {
    let numText = ''
    let extra = ''
    let num = ''
    const { designWidth } = state
    const tileWidth = designWidth / instance.col
    let width = Math.round(rect.width * tileWidth)
    let height = Math.round(rect.height * tileWidth)

    // 188 计算出来会变成376，这里做特殊判断
    const displayWidth = width === 188 ? designWidth : Math.round(width * 2)
    const displayHeight = height === 188 ? designWidth : Math.round(height * 2)

    if (templateType <= 3) {
      num = `宽度${displayWidth}像素`
    } else {
      num = `${displayWidth}x${displayHeight}`
      if (width > 64) {
        numText = '像素'
      }

      // 判断是否超过最小面积
      if (width * height > 3100) {
        extra = '或同等比例'
      }
    }

    rect.text = {
      num,
      numText,
      extra
    }
  }, [state])
  const getRectsFromTemplate = useCallback(template => {
    template.data.forEach(item => {
      item.id = uniqueId('cube')
      setRectText(item, template.type)
    })
    return template.data
  }, [])
  // 改变魔方密度
  const handleCudeDensityChange = useCallback((value: any) => {
    instance.tileRefs={}
    let tileSeed = []
    let arr = []
    for (let i = 0; i < value; i++) {
      for (let j = 0; j < value; j++) {
        const id = uniqueId('cube')
        instance.tileRefs[id]={top:j,left:i}
        arr.push({ id,top:j,left:i})
      }
      tileSeed.push(arr)
      arr = []
    }
    instance.col=value
    setState((prevState) => ({ ...prevState, tileSeed: tileSeed }))


  }, [])

   // 获取前3个魔方模版中，第一个矩形里面的图片高度
   const getFirstImgHeight=(url, width)=>{
    return new Promise((resolve, reject) => {
      let div = document.createElement('div')
      const tileWidth = state.designWidth / instance.col
      const size = `${width * tileWidth}px`
      div.style.width = size
      div.style.height = size
      let img = document.createElement('img')
      img.src = app.toImageUrl(url)
      img.style.cssText = 'max-width: 100%;width: 100%;height: 100%;'
      img.onload = (e:any) => {
        resolve(e.target.height)
        div.remove()
      }
      img.onerror = () => {
        reject('图片加载失败')
      }
      div.appendChild(img)
      document.body.appendChild(div)
    })
  }
  const getContainerHeight = rects => {
    const tileWidth = state.designWidth / instance.col
    let bottomList = []
    rects.forEach(rect => {
      bottomList.push(rect.top + (rect.height || rect.width))
    })
    const bottom = bottomList.length ? Math.max(...bottomList) : 1
    return bottom * tileWidth
  }

  const handleTemplateClick = useCallback(async (template: any) => {
    let imgs = getImgsFromState(template.type)
    if (template.type === 'customize') {
      // 判断是否点击了当前激活的模版
      if (state.currentTemplate.type === template.type) {
        setState((prevState) => ({
          ...prevState,
          imgs,
          templateType:template.type,
          col:instance.col
        }))
      } else {
        // 从默认模版切换到自定义模版，这个时候将数据都清空
        handleCudeDensityChange(4)
        setState((prevState) => ({
          ...prevState,
          templateType:template.type,
          col:4,
          currentTemplate: template,
          imgs,
          adviceUrls: [],
          urlTypes: [],
          rects: []
        }))
      }
    } else {
      instance.col = template.col
      const { width } = template.data[0]
      const firstImgUrl = imgs.map((img)=>transformFilesToUrls(img)[0])[0]
      let rects = []
      imgs = imgs.slice(0, template.data.length)
      let containerHeight
      // 前3个魔方模版，需要根据模版中第一个矩形的宽度，
      // 动态获取矩形里面图片的高度
      if (template.type <= 3) {
        let currentTemplate = { ...template }
        rects = getRectsFromTemplate(currentTemplate)
        setState((prevState)=>({...prevState,
          rects,
          currentTemplate
        }))
        if (firstImgUrl) {
          // 高度以第一张图片的高度为准
          containerHeight = await getFirstImgHeight(firstImgUrl, width)
        } else {
          containerHeight = getContainerHeight(rects)
        }
      } else {
        rects = getRectsFromTemplate(template)
        containerHeight =state.designWidth
        setState((prevState)=>({...prevState,rects,
          currentTemplate: template}))
      }

      const newAdviceUrls = state.adviceUrls.slice(0, template.data.length)
      const newUrlTypes = state.urlTypes.slice(0, template.data.length)
      setState((prevState)=>({...prevState,containerHeight,
        adviceUrls: newAdviceUrls,
        urlTypes: newUrlTypes,
        imgs,
        col: instance.col,
        templateType: template.type
      }))
    }
  }, [state])

  let handleSliderChange =useCallback(value => {
    setState((prevState)=>({
      ...prevState,
      imgMargin: value
    }))
  },[])

  useEffect(() => {
    if (id) {
      contentService.getMagicCubeDetail({ id: id }).then((d: any) => {
        form.setFieldsValue({
          title: d.title,
        });
        try{
          let data=JSON.parse(d.contentStyle)
          const currentTemplate = templates.find(item => item.type === data.templateType)
          instance.col=data.col
          setState((prevState)=>({...prevState,
            // 模版类型，默认显示`1行2个`模版
            templateType: data.templateType,
            currentTemplate:currentTemplate,
            rects: data.rects,
            containerHeight: data.containerHeight,
            /**
             * 选择完图片的时候，要根据选择的矩形下标index，
             * 然后用矩形下标index插入imgs数组的index
             */
            imgs:Array.isArray(data.imgs)?data.imgs.map((imgFile=>{
              return [normalizeFile(imgFile)].filter(Boolean)
            })):[],
            col: data.col,
            imgMargin: data.margin,
            urlTypes: data.urlTypes,
            adviceUrls: data.adviceUrls
          }),(state)=>{
            console.log('绑定')
            instance.handleTemplateClick(state.currentTemplate)
            instance.handleCudeDensityChange(instance.col)
          })
        }catch(e){
          console.log('异常',e)
        }
      });
    }else{
      handleTemplateClick(state.currentTemplate)
      handleCudeDensityChange(instance.col)
    }
  }, [id]);
  useEffect(() => {
    diyService.getAllDiyTheme().then((d: any) => {
      setThemeList(d)
    })
  }, []);
  instance.handleTemplateClick=handleTemplateClick
  instance.handleCudeDensityChange=handleCudeDensityChange
  const adviceUrl = state.adviceUrls[state.activeRectIndex]
  const urlType = state.urlTypes[state.activeRectIndex]
  let currentImage=[]
  if(state.imgs[state.activeRectIndex]){
    currentImage=state.imgs[state.activeRectIndex]
  }

  return (
    <Card>
      <Form {...formLayout} form={form} onFinish={onSaveUpdate} scrollToFirstError>
        <Form.Item
          label="方案名称"
          name="title"
          rules={[
            { required: true, message: '请输入方案名称', whitespace: true },
          ]}
        >
          <Input maxLength={50}></Input>
        </Form.Item>
        <Form.Item label="选择模版">
          <div className={styles.wrap}>
            {templates.map((item, index) => {
              let activeCls = ''
              if (item.type === state.currentTemplate.type) {
                activeCls = styles.activeBorder
              }
              return (
                <div
                  key={index}
                  className={`${styles.tpl} ${activeCls}`}
                  onClick={() => handleTemplateClick(item)}
                >
                  <img src={item.bg} alt={item.name} />
                  <p>{item.name}</p>
                </div>
              )
            })}
          </div>
        </Form.Item>
        {state.currentTemplate.type === 'customize' ? (
            <Form.Item label="魔方密度">
              <Select
                style={{ width: 150 }}
                onChange={value => {
                  handleCudeDensityChange(value)
                  setState((prevState)=>({...prevState,
                    rects: [],
                    imgs: [],
                    urlTypes: [],
                    adviceUrls: []
                  }))
                }}
                defaultValue={instance.col}
              >
                <Select.Option value={4}>4X4</Select.Option>
                <Select.Option value={5}>5X5</Select.Option>
                <Select.Option value={6}>6X6</Select.Option>
                <Select.Option value={7}>7X7</Select.Option>
              </Select>
            </Form.Item>
        ) : null}
        <Form.Item label="布局">{renderCurrentTemplate()}</Form.Item>
        <Form.Item label="图片间隙">
          <Row>
            <Col span={17}>
              <Slider
                min={0}
                max={10}
                onChange={handleSliderChange}
                value={state.imgMargin}
              />
            </Col>
            <Col span={7}>
              <InputNumber
                min={0}
                max={10}
                style={{ marginLeft: 16 }}
                onChange={value => handleSliderChange(value || 0)}
                value={state.imgMargin}
              />
            </Col>
          </Row>
        </Form.Item>
        <Form.Item label="设置图片">
          <UploadImage maxCount={1} fileList={currentImage} draggleSort={false} onChange={handlePhotoChange}></UploadImage>
        </Form.Item>
        <Form.Item label="链接类型">
          <Form.Item>
            <Radio.Group
              value={urlType}
              onChange={(e:any) => {
                const urlType = e.target.value
                let newUrlTypes = [...state.urlTypes]
                let newAdviceUrls = [...state.adviceUrls]
                newUrlTypes[state.activeRectIndex] = urlType
                newAdviceUrls[state.activeRectIndex] = ''
                setState((prevState)=>({...prevState,
                  adviceUrls: newAdviceUrls,
                  urlTypes: newUrlTypes
                }))
    

              }}
            >
              {ADVERTISE_URL_TYPES.values.map((d) => (
                <Radio key={d.value} value={d.value}>
                  {d.text}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item noStyle>
           <div>{renderUrlType(urlType,adviceUrl)}</div>
          </Form.Item>
        </Form.Item>
        <Form.Item colon={false} label={<span></span>}>
          <Space>
            <Button
              onClick={() => {
                props.history.push('/content/home-magic-cube');
              }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};
export default MagicCubeEditor
