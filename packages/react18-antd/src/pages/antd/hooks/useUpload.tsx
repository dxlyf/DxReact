import { Button, Modal, Upload, Image, Typography, message } from 'antd'
import type { GetProp, UploadFile, UploadProps } from 'antd'
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'
import useControllerValue from './useControllerValue'
import { useMemoizedFn } from 'ahooks'
export type LimitType = {
    size?: number // mb
    types?: string[]
}
export type UseUploadProps = Omit<UploadProps, 'onChange'> & {
    onChange: (files: UploadFile[]) => void
    onChangeFile?:(file:UploadFile)=>void
    limit?: {

    }
}
const isImageFile = (file: UploadFile): boolean => {
    return file.type.startsWith('image/')
}
function downloadFromFile(file:UploadFile,filename?:string){
    let url =file.url||file.thumbUrl;
    let isObjectUrl=false
    if(!url&&file.originFileObj){
        url=URL.createObjectURL(file.originFileObj)
        isObjectUrl=true
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = filename||file.name;
    a.style.display = 'none';
    a.target='_blank'
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        isObjectUrl&&URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }, 0);
}
const defaultLimit: LimitType = {
    size: 10,
    types: ['.png']
}
const useUpload = (props: UseUploadProps) => {
    const { onChange,onChangeFile, accept: propAccept, limit: propLimit, ...restProps } = props
    const [, forceUpdate] = useReducer(v => v + 1, 0)
    const limit = {
        ...(propLimit ? { ...defaultLimit, ...propLimit } : {})
    }
    const uploadRef = useRef()
    const accept = propAccept !== undefined ? propAccept : limit.types ? limit.types.join(',') : undefined
    const [fileList, setFileList] = useControllerValue<UploadFile[]>({
        value: props.fileList,
        defaultValue: props.defaultFileList || [],
        onChange:onChange
    })
    const handlePreviewFile = useCallback((file: File) => {
        return new Promise<string>((resolve) => {
            let fileRead = new FileReader()
            fileRead.onload = (e) => {
                resolve(e.target.result as string)
            }
            fileRead.readAsDataURL(file)
        })
    }, [])
    const mergeFileList = useMemo(() => {
        return fileList.map(file => {
            if (!file.url && file.thumbUrl === undefined && file.originFileObj) {
                file.thumbUrl = ''
                handlePreviewFile(file.originFileObj).then(url => {
                    file.thumbUrl = url
                    //forceUpdate()
                })
            }
            return file
        })
    }, [fileList])
    const handleChange = useMemoizedFn<GetProp<typeof Upload, 'onChange'>>((info) => {
        const { fileList, file } = info
        onChangeFile?.(file)
        setFileList(fileList)
    })
    const handleBeforeUpload = useMemoizedFn<GetProp<typeof Upload, 'beforeUpload'>>((file) => {
        return new Promise((resolve, reject) => {
            if (propLimit) {
                const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
                const types = limit.types
                if (!types.includes(ext)) {
                    message.warning(`仅支持上传类型：${types.join()}`)
                    resolve(Upload.LIST_IGNORE)
                    return
                }
                if (file.size / Math.pow(1024, 2) > limit.size) {
                    message.warning(`最大支持上传文件大小为：${Number(limit.size.toFixed(1))}mb`)
                    resolve(Upload.LIST_IGNORE)
                    return
                }
                resolve(file)
            }
        })
    })
    const [previewImage, setPreviewImage] = useState<{ visible: boolean, fileList: UploadFile[] }>({
        visible: false,
        fileList: []
    })

    // const [modalDom,modal]=useModal({
    //     width:'70%',
    //     height:'70%',
    //     children(d){
    //         const children=d.data
    //         return <>{children}</>
    //     }
    // })

    const uploadProps: UploadProps = {
        action: '/api/upload',
        accept: accept,
        fileList: mergeFileList,
        showUploadList: {
            // extra:<Button>外部</Button>,
            showPreviewIcon: true,
            showDownloadIcon: true,
            showRemoveIcon: true,
            // previewIcon:<Button>预览</Button>
        },
        listType: 'text',
        // previewFile:handlePreviewFile,
        onPreview: async (file) => {
            const type = file.type
            if (isImageFile(file)) {
                const imageList = fileList.filter(file => isImageFile(file))
                if (imageList.length > 0) {
                    setPreviewImage({
                        visible: true,
                        fileList: imageList
                    })
                }
            }
        },
        onDownload(file) {
            //window.open(file.url,'_blank')
            downloadFromFile(file)
        },
        onChange: handleChange,
        beforeUpload: handleBeforeUpload,
        // openFileDialogOnClick:false,
        // ref:uploadRef,
        // itemRender(originNode,file,fileList,action){
        //     console.log('file',file,'originNode',originNode)
        //     return <Typography.Text style={{width:100}}  title={file.name} ellipsis={{     
        //     }}></Typography.Text>
        // },

        ...restProps
    }
    const ret = [uploadProps, {
        previewImage,
        setPreviewImage
    }] as const
    return ret
}
export default useUpload