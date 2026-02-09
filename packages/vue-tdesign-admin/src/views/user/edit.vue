<template>
  <PageProvider>
    <div class="user-edit">
      <!-- 页面标题和面包屑 -->
      <div class="page-header">
        <div class="page-header__title">
          <h2>{{ isNewAdd ? '用户新增' : '用户编辑' }}</h2>
        </div>
        <div class="page-header__breadcrumb">
          <t-breadcrumb>
            <t-breadcrumb-item>
              <router-link to="/">首页</router-link>
            </t-breadcrumb-item>
            <t-breadcrumb-item>
              <router-link to="/user">用户列表</router-link>
            </t-breadcrumb-item>
            <t-breadcrumb-item>{{ isNewAdd ? '用户新增' : '用户编辑' }}</t-breadcrumb-item>
          </t-breadcrumb>
        </div>
      </div>

      <!-- 表单 -->
      <div class="form-container">
        <t-form
          ref="formRef"
          :layout="'vertical'"
          :model="formData"
          :rules="formRules"
          label-align="top"
          @submit.prevent
        >
          <t-form-item label="用户名" name="username">
            <t-input v-model="formData.username" placeholder="请输入用户名" />
          </t-form-item>
          <t-form-item label="姓名" name="name">
            <t-input v-model="formData.name" placeholder="请输入姓名" />
          </t-form-item>
          <t-form-item label="邮箱" name="email">
            <t-input v-model="formData.email" placeholder="请输入邮箱" />
          </t-form-item>
          <t-form-item label="角色" name="role">
            <t-select v-model="formData.role" placeholder="请选择角色">
              <t-option value="admin" label="管理员" />
              <t-option value="user" label="普通用户" />
            </t-select>
          </t-form-item>
          <t-form-item label="状态" name="status">
            <t-select v-model="formData.status" placeholder="请选择状态">
              <t-option value="draft" label="草稿" />
              <t-option value="publish" label="发布" />
            </t-select>
          </t-form-item>
        </t-form>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <t-button type="primary" :loading="loading" @click="handleSubmit">
          {{ isNewAdd ? '新增' : '更新' }}
        </t-button>
        <t-button @click="handleBack">返回列表</t-button>
      </div>
    </div>
  </PageProvider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { PageProvider } from '@/components/page-provider';

const router = useRouter();
const route = useRoute();
const formRef = ref<any>(null);
const loading = ref(false);

// 判断是否为新增
const isNewAdd = computed(() => {
  return !route.params.id;
});

// 表单数据
const formData = ref({
  username: '',
  name: '',
  email: '',
  role: '',
  status: ''
});

// 表单验证规则
const formRules = ref({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
});

// 获取用户详情
const fetchUserDetail = async () => {
  try {
    const id = route.params.id as string;
    // 实际项目中替换为真实API调用
    // const response = await request.get(`/api/users/${id}`);
    // formData.value = response.data;
    
    // Mock数据
    formData.value = {
      username: `user${id}`,
      name: `用户${id}`,
      email: `user${id}@example.com`,
      role: 'user',
      status: 'publish'
    };
  } catch (error) {
    console.error('获取用户详情失败:', error);
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    // 表单验证
    const valid = await formRef.value?.validate();
    if (!valid) return;

    loading.value = true;

    // 根据是否为新增调用不同的API
    if (isNewAdd.value) {
      // 新增用户
      // await request.post('/api/users', formData.value);
      console.log('新增用户:', formData.value);
    } else {
      // 更新用户
      const id = route.params.id as string;
      // await request.put(`/api/users/${id}`, formData.value);
      console.log('更新用户:', id, formData.value);
    }

    // 成功提示
    // 实际项目中替换为真实的提示组件
    alert('操作成功');

    // 返回列表页
    router.push('/user');
  } catch (error) {
    console.error('操作失败:', error);
    // 失败提示
    alert('操作失败');
  } finally {
    loading.value = false;
  }
};

// 返回列表
const handleBack = () => {
  router.push('/user');
};

// 初始化
onMounted(() => {
  if (!isNewAdd.value) {
    fetchUserDetail();
  }
});
</script>

<style scoped lang="less">
.user-edit {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
  .page-header__title {
    margin-bottom: 16px;
  }
}

.form-container {
  background-color: #fff;
  padding: 24px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
  max-width: 800px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  max-width: 800px;
}
</style>