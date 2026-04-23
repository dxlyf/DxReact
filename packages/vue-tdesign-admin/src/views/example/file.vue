<script setup lang="ts">
import { reactive, ref } from 'vue'
import {IndexDB} from '@/utils/indexDB'
const isConnected = ref(false)

const indexDB=new IndexDB({
    dbName:'vue-tdesign-admin',
    version:1,
})
indexDB.initDB()
const handleConnect = async () => {
    try{
        let dirHandle=await indexDB.getItem('dirHandle')
        if(!dirHandle){
            dirHandle=await window.showDirectoryPicker({
                mode:'readwrite',
                startIn:'desktop',
            }) as FileSystemDirectoryHandle
        }
    //    const status=await dirHandle.queryPermission({mode:'readwrite'})
        if(await dirHandle.queryPermission({mode:'readwrite'})!=='granted'){
            throw new FileSystemError('无法获取目录读写权限', 'PERMISSION_DENIED');
        }
        if(await dirHandle.requestPermission({mode:'readwrite'})!=='granted'){
            throw new FileSystemError('无法获取目录读写权限', 'PERMISSION_DENIED');
        }
        console.log('目录读写权限已获取')
        indexDB.setItem('dirHandle',dirHandle)
        isConnected.value=true
    }catch(err){
        isConnected.value=false
        console.log(err)
    }
  
}
const formData=reactive({
    key:'key',
    value:'123',
    key2:'key',
    value2:'',
})
const handleSetItem=async()=>{
    indexDB.setItem(formData.key,formData.value)
}
const handleGetItem=async()=>{
    formData.value2=await indexDB.getItem(formData.key2)
}
</script>
<template>
    <div>
        <h1>文件管理fd</h1>
      <t-space>
        <t-input placeholder="key" v-model="formData.key" />
        <t-input placeholder="value" v-model="formData.value" />
        <t-button @click="handleSetItem">设置项</t-button>
      </t-space>
          <t-space>
        <t-input placeholder="key2" v-model="formData.key2" />
        <t-input placeholder="value2" v-model="formData.value2" />
        <t-button @click="handleGetItem">获取项</t-button>
      </t-space>
        <div>
            <t-button @click="handleConnect">连接本地</t-button>
        </div>
    </div>
</template>