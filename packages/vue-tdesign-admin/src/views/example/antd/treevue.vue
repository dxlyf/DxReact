<script setup lang="ts">
import { shallowRef } from 'vue';
import {Button,Tree} from 'ant-design-vue'
import type {
  AntTreeNodeDragEnterEvent,
  AntTreeNodeDropEvent,
  TreeDataItem,
  TreeProps,
} from 'ant-design-vue/es/tree';
const treeData=shallowRef([
    {
        title:'一级',
        key:'1',
        children:[
            {
                title:'二级',
                key:'1-1',
                children:[
                    {
                        title:'三级',
                        key:'1-1-1',
                    }
                ]
            }
        ]
    },
    {
        title:'一级2',
        key:'2',
        children:[
            {
                title:'二级2',
                key:'2-1',
            },
            {
                title:'二级2-2',
                key:'2-2',
            },
            {
                title:'二级2-3',
                key:'2-3',
            },
        ]
    },
    {
        title:'一级3',
        key:'3',
    },
])
const onDragEnter = (info: AntTreeNodeDragEnterEvent) => {
  console.log(info);
  // expandedKeys 需要展开时
  // expandedKeys.value = info.expandedKeys;
};

const onDrop = (info: AntTreeNodeDropEvent) => {
  console.log(info);
  const dropKey = info.node.key;
  const dragKey = info.dragNode.key;
  const dropPos = info.node.pos.split('-');
  const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);
  const loop = (data: TreeProps['treeData'], key: string | number, callback: any) => {
    data.forEach((item, index) => {
      if (item.key === key) {
        return callback(item, index, data);
      }
      if (item.children) {
        return loop(item.children, key, callback);
      }
    });
  };
  const data = [...treeData.value];

  // Find dragObject
  let dragObj: TreeDataItem;
  loop(data, dragKey, (item: TreeDataItem, index: number, arr: TreeProps['treeData']) => {
    arr.splice(index, 1);
    dragObj = item;
  });
  if (!info.dropToGap) {
    // Drop on the content
    loop(data, dropKey, (item: TreeDataItem) => {
      item.children = item.children || [];
      /// where to insert 示例添加到头部，可以是随意位置
      item.children.unshift(dragObj);
    });
  } else if (
    (info.node.children || []).length > 0 && // Has children
    info.node.expanded && // Is expanded
    dropPosition === 1 // On the bottom gap
  ) {
    loop(data, dropKey, (item: TreeDataItem) => {
      item.children = item.children || [];
      // where to insert 示例添加到头部，可以是随意位置
      item.children.unshift(dragObj);
    });
  } else {
    let ar: TreeProps['treeData'] = [];
    let i = 0;
    loop(data, dropKey, (_item: TreeDataItem, index: number, arr: TreeProps['treeData']) => {
      ar = arr;
      i = index;
    });
    if (dropPosition === -1) {
      ar.splice(i, 0, dragObj);
    } else {
      ar.splice(i + 1, 0, dragObj);
    }
  }
  treeData.value = data;
};
</script>
<template>
    <div class="flex flex-col h-full">
        <div class="flex-1 flex gap-4">
            <div class="w-[260px] rounded-sm bg-white">
                <Tree  draggable
    block-node
    :tree-data="treeData"
    @dragenter="onDragEnter"
    @drop="onDrop"></Tree>
            </div>
                 <div class="flex-1 rounded-sm bg-white">
                    <Button type="primary">新增</Button>
                 </div>
                 <t-button theme="primary">删除</t-button>
        </div>
    </div>
</template>