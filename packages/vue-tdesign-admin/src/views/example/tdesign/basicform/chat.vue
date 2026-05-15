<script setup lang="ts">
import { ref } from 'vue';


// 自己维护消息历史
const messages = ref([
  { role: 'system', content: 'You are a helpful assistant.' }
]);

let lastReasoningContent = '';

const handleNewMessage = (msg) => {
  // 当用户发送新消息时，添加到历史中
  messages.value.push({
    role: msg.role,
    content: msg.content
  });
};

// 对话服务配置

const chatServiceConfig = {
  // 1. DeepSeek官方 API 地址（保持不变）
  endpoint: 'https://api.deepseek.com/chat/completions',
  stream: true,
  
  // 2. 请求拦截：在这里配置请求头和 API Key
  onRequest: (params) => {
    // 生产环境建议将 API Key 放在后端，这里仅为示例
    const apiKey = 'sk-f1a38fc6faf84db38afaba8fb56cd8c3'; 
      // 关键：你需要自己管理消息历史
    // 可以通过一个 ref 数组来维护 messages
    const currentMessages = [...messages.value];  // messages 是你自己维护的数组
    
    // 如果上一轮有 reasoning_content，要加回最后一条 assistant 消息
    if (lastReasoningContent && currentMessages.length > 0) {
      const lastMsg = currentMessages[currentMessages.length - 1];
      if (lastMsg.role === 'assistant' && !lastMsg.reasoning_content) {
        lastMsg.reasoning_content = lastReasoningContent;
      }
    }
    
    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        // 关键点：模型名称请使用 deepseek-v4-flash
        model: 'deepseek-v4-flash', 
        messages: currentMessages,  // 使用自己维护的消息列表
        stream: true,
        temperature: 0.7,
    ...params
      }),
    };
  },
  
   onMessage: (chunk) => {
    const chunkData = chunk.data;
    if (!chunkData) return null;
    
    const { delta, finish_reason } = chunkData.choices?.[0] || {};
    
    // 保存 reasoning_content 供下一轮使用
    if (delta?.reasoning_content) {
      lastReasoningContent = delta.reasoning_content;
      // 使用 'thinking' 类型展示思考过程
      return {
        type: 'thinking',
        data: {
          title: '正在思考...',
          text: delta.reasoning_content,
        },
        status: 'streaming',
      };
    }
    
    // 处理普通文本内容
    if (delta?.content) {
      return {
        type: 'markdown',
        data: delta.content,
        status: finish_reason === 'stop' ? 'complete' : 'streaming',
      };
    }
    
    // 结束标记
    if (finish_reason === 'stop') {
      return {
        type: 'markdown',
        data: '',
        status: 'complete',
      };
    }
    
    return null;
  },
};
</script>

<template>
  <t-chatbot @message="handleNewMessage" :chat-service-config="chatServiceConfig" />
</template>