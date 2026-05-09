<script setup lang="ts">
import { shallowRef ,ref} from 'vue';


const activePanelKeys=ref(['1','2'])
const handlAddCategory=()=>{
    if(!activePanelKeys.value.includes('1')){
        activePanelKeys.value.push('1')
    }
}
const handleAddDocumentItem=()=>{

}
</script>

<template>
 <div>
    <t-collapse v-model="activePanelKeys" expand-icon-placement="right" :expand-on-row-click="false" :default-expand-all="true" class="f-form-collapse"  :expand-mutex="false">
        <t-collapse-panel value="1">
            <template #header>
                <div class="header">
                    分类
                </div>
            </template>
            <template #headerRightContent>
                <t-button size="small" theme="primary" variant="outline" @click="handlAddCategory">
                    新增分类
                </t-button>
            </template>
        </t-collapse-panel>
              <t-collapse-panel value="2">
            <template #header>
                <div class="header">
                    文档
                </div>
            </template>
            <template #headerRightContent>
                <t-button size="small" theme="primary" variant="outline" @click="handleAddDocumentItem">
                    新增文档
                </t-button>
            </template>
        </t-collapse-panel>
    </t-collapse>
 </div>
</template>
<style>
.f-form-collapse{
  
}
.header{
    border-left: solid 4px var(--td-brand-color-7);
    padding-left: 4px;
    line-height: 1;
}
</style>