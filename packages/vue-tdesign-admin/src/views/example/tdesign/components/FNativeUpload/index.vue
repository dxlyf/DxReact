<script setup lang="ts">
import { shallowRef, ref, toRefs } from 'vue'
import { runWithConcurrency,fileToBase64} from '@/utils'
import { useVModel } from '@/hooks/useVModel'
type Props = {
    accept?: string
    multiple?: boolean
    modelValue?: FileInfo[]
    value?: FileInfo[]
    defaultValue?: FileInfo[]
    onChange?: (files: FileInfo[]) => void
}

type FileInfo = {
    uid?: number
    originalFile: File
    url?: string
    name?: string
    thumbnail?: string
    status?: 'success' | 'fail' | 'progress' | 'pending'
    percent?: number
    response?: any
}
const emit = defineEmits(['update:modelValue'])
const props = withDefaults(defineProps<Props>(), {
    accept: '.jpg,.png,.jpeg',
    multiple: false,
    defaultValue:()=>[]
})
const { value, modelValue } = toRefs(props)
let uploadUid = 0
const dragActive = shallowRef(false)
const fileRef = shallowRef<HTMLInputElement>(null)
const visiblePreview=ref(false)
const [files, setFiles] = useVModel(value, modelValue, props.defaultValue, props.onChange)

files.value.forEach((item) => {
    item.uid = uploadUid++
    item.status = 'pending'
})
const uploadFile = (file: FileInfo, onProgress: (percent: number) => void) => {
    return new Promise<any>((resolve, reject) => {

        //   const xhrUpload=new XMLHttpRequestUpload()
        const xhr = new XMLHttpRequest()
        // xhr.onreadystatechange=()=>{
        //     if(xhr.readyState===XMLHttpRequest.DONE){
        //         if(xhr.status===200){
        //             resolve(xhr.responseText)
        //         }else{
        //             reject(xhr.statusText)
        //         }
        //     }
        // }
        xhr.upload.onprogress = (e) => {
             const percentComplete = e.loaded / e.total * 100
                onProgress(percentComplete)
                console.log(`上传进度:${percentComplete.toFixed(2)}%`)
        }
        xhr.onload = () => {
            if (xhr.status >= 200&&xhr.status<300) {
                resolve(JSON.parse(xhr.responseText||xhr.response))
            } else {
                reject(xhr.statusText)
            }
        }
        xhr.onerror = () => {
            reject(xhr.statusText)
        }

        const body = new FormData()
        body.append('file', file.originalFile,file.name)
       // body.append('filename', file.name)
        xhr.open('POST', '/api/upload',true)
        const headers={
         //   'Content-Type': 'multipart/form-data',
           // 'Content-Disposition': `form-data; name="file"; filename="${file.name}"`,
        }
        Object.keys(headers).forEach((key) => {
            xhr.setRequestHeader(key, headers[key])
        })
        xhr.send(body)
       // xhr.upload.requestHeaders=headers
    })
}

const forceUpdateFiles=()=>{
    files.value=[...files.value]
}
const batchUploadFile = async (upFiles: File[]) => {
    const uploadTasks = upFiles.map((file) => {
        return normalizeFileBlob(file)
    });
    setFiles([...files.value, ...uploadTasks])
    await runWithConcurrency(
        uploadTasks,
        async (index, fileInfo) => {
            const updateFileInfo=files.value.find((item)=>item.uid===fileInfo.uid)
            console.log('fileInfo',updateFileInfo)
            updateFileInfo.status = 'progress'
            //fileInfo.thumbnail=URL.createObjectURL(fileInfo.originalFile)
            await fileToBase64(fileInfo.originalFile).then((base64) => {
                updateFileInfo.thumbnail = base64
                // files.value=[...files.value]
            })
            try {
                const res = await uploadFile(fileInfo, (p) => {
                    updateFileInfo.percent = p
                    //forceUpdateFiles()
                });
                updateFileInfo.url=res?.data?.files[0]?.url||''
                updateFileInfo.status = 'success'
                updateFileInfo.response = res
                //forceUpdateFiles()
                 console.log('上传成功',fileInfo)
            } catch (e) {
                updateFileInfo.status = 'fail'
               //  forceUpdateFiles()
            }finally{
               // URL.revokeObjectURL(fileInfo.thumbnail)
            }
        },
        {
            maxConcurrency: 3,
        }
    );
};
const normalizeFileBlob = (file: File): FileInfo => {
    return {
        originalFile: file,
        name: file.name,
        uid: uploadUid++,
        percent: 0,
        url: ''
    }
}
const handleUpload = (e: Event) => {
    const target = e.target as HTMLInputElement
    const files = target.files
    if (files) {
        batchUploadFile(Array.from(files))
    }
}
const handleSelectFile = () => {
    fileRef.value?.click()
}
const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer?.files
    if (files) {
        batchUploadFile(Array.from(files))
    }
}
const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
    dragActive.value = true
}
const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    dragActive.value = false
}
const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
}
</script>

<template>
    <div class="f-native-upload">
        <input type="file" ref="fileRef" @change="handleUpload" :multiple="multiple" class="input-file"
            :accept="accept" />
        <div v-if="files.length<=0" class="drop-area" @dragover="handleDragOver" @dragenter="handleDragEnter" @dragleave="handleDragLeave"
            @drop="handleDrop" @click="handleSelectFile">
            <t-icon name="upload" size="20"></t-icon>
            <div class="mt-4 text-lg">
                {{ dragActive ? '释放文件上传' : '点击上传或拖拽文件到此处' }}
            </div>
        </div>
        <div v-else class="w-full h-full relative group [&_.t-image-viewer\_\_trigger]:!hidden">
            <t-image fit="cover" class="w-full h-full" :src="files[0].url"></t-image>
            <t-image-viewer  @close="visiblePreview=false"  :visible="visiblePreview" :images="files.map(d=>d.uid||d.thumbnail)"></t-image-viewer>
            <div class="hidden text-white gap-6 group-hover:flex absolute z-10 bg-[rgba(0,0,0,0.5)] inset-0 flex items-center justify-center">
                <t-icon name="browse" size="20" class="cursor-pointer" @click="visiblePreview=true"></t-icon>
                <t-icon name="delete" size="20" class="cursor-pointer" @click="files=[]"></t-icon>
            </div>
        </div>
    </div>
</template>
<style scoped>
.f-native-upload {
    display: flex;
    align-items: center;
    width: 300px;
    height: 200px;
}

.f-native-upload .input-file {
    display: none;
}

.f-native-upload .drop-area {
    width: 100%;
    height: 100%;
    border: 1px dashed #ccc;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.f-native-upload .drop-area:hover {
    border-color: #00a2ff;
}
.file-list{
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}
.file-item{
    width: 150px;
    height: 150px;
}
.file-item img{
    width: 100%;
    height: 100%;
    object-fit: cover;
}
</style>