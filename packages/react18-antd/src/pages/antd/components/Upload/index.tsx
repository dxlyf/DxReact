import {Button, Upload,Image} from 'antd'
import useUpload,{type UseUploadProps} from '../../hooks/useUpload'
import { UploadOutlined } from '@ant-design/icons'


const ProUpload=(props:UseUploadProps)=>{
    const [{maxCount,...selectProps},{previewImage,setPreviewImage}]=useUpload(props)
   
    return <>
     <Upload maxCount={maxCount} {...selectProps}><Button  icon={<UploadOutlined></UploadOutlined>}>上传</Button></Upload>
     {previewImage.visible&&<div style={{ display: 'none' }} onMouseDown={e=>{
            e.stopPropagation()
         }}>
        <Image.PreviewGroup preview={{ visible:previewImage.visible, onVisibleChange: vis =>{
            if(!vis){
                setPreviewImage({visible:false,fileList:[]})
            }
        } }}>
        {previewImage.fileList.map((file,index)=>{
            return <Image key={file.uid||index} src={file.thumbUrl||file.url}></Image>
        })}
        </Image.PreviewGroup>
      </div>}
    </>
}

export default ProUpload