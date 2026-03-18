<script  lang="ts">
import { defineComponent,provide,ref,toRef,type PropType } from 'vue'
import TreeNode,{type TreeNodeItem} from './TreeNode.vue'



// const props=withDefaults(defineProps<Props>(),{
//     data:()=>[]
// })
export default defineComponent({
    name:'Tree',
    props:{
        data:{
            type:Array as PropType<TreeNodeItem[]>,
            default:()=>{

                return [
                    {
                        value:'1',
                        label:'1',
                        children:[
                            {
                                value:'1-1',
                                label:'1-1'
                            },
                            {
                                value:'1-2',
                                label:'1-2'
                            },
                            {
                                value:'1-3',
                                label:'1-3',
                                children:[
                                    {
                                        value:'1-3-1',
                                        label:'1-3-1'
                                    },
                                    {
                                        value:'1-3-2',
                                        label:'1-3-2'
                                    },
                                    {
                                        value:'1-3-3',
                                        label:'1-3-3',
                                        children:[
                                        {
                                            value:'1-3-3-1',
                                            label:'1-3-3-1'
                                        }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        }
    },
    components:{
       TreeNode
    },
    setup(props){
        const expandedKeys=ref<string[]>([])
        provide('TREE_CONTEXT',{
            isExpanded:(key:string)=>{
                return expandedKeys.value.includes(key)
            },
            setExpandedKeys:(keys:string[])=>{
                expandedKeys.value=keys
            },
            toggleExpanded:(key:string)=>{
                if(expandedKeys.value.includes(key)){
                    expandedKeys.value=expandedKeys.value.filter((item)=>item!==key)
                }else{
                    expandedKeys.value.push(key)
                }
                //setExpandedKeys(expandedKeys.value)
            }
        })
        return{
            data:toRef(props,'data')  
        }
    }
})
</script>

<template>
    <div class="tree">
        <div v-for="(item,index) in data" :key="item.value">
            <TreeNode  v-model="data[index]" />
        </div>
    </div>
</template>
<style>
    .tree{

    }
</style>