<template>
  <PageProvider>
    <div class="flex flex-col">
      <!-- 页面标题和面包屑 -->
      <div class="page-header">
        <div class="page-header__title">
          <h2>用户列表</h2>
        </div>
        <div class="page-header__breadcrumb">
          <t-breadcrumb>
            <t-breadcrumb-item>
              <router-link to="/">首页</router-link>
            </t-breadcrumb-item>
            <t-breadcrumb-item>用户列表</t-breadcrumb-item>
          </t-breadcrumb>
        </div>
      </div>

      <!-- 查询表单 -->
      <div class="search-form">
        <t-form :layout="'inline'" :model="searchForm" @submit.prevent>
          <t-form-item label="用户名" :colon="false">
            <t-input v-model="searchForm.username" placeholder="请输入用户名" />
          </t-form-item>
          <t-form-item label="姓名" :colon="false">
            <t-input v-model="searchForm.name" placeholder="请输入姓名" />
          </t-form-item>
          <t-form-item label="状态" :colon="false">
            <t-select v-model="searchForm.status" placeholder="请选择状态">
              <t-option value="draft" label="草稿" />
              <t-option value="publish" label="发布" />
            </t-select>
          </t-form-item>
          <t-form-item>
            <t-button type="primary" @click="handleSearch">查询</t-button>
            <t-button @click="resetForm">重置</t-button>
          </t-form-item>
        </t-form>
      </div>

      <!-- 功能按钮 -->
      <div class="action-buttons">
        <t-button type="primary" @click="handleAdd">新增用户</t-button>
        <t-button @click="handleExport">导出</t-button>
      </div>

      <!-- 数据表格 -->
      <div class="data-table">
        <t-table
          v-model:selected-rows="selectedRows"
          :data="userList"
          :columns="columns"
          horizontal-scroll-affixed-bottom
          :row-key="'id'"
          maxHeight="300"
          header-affixed-top
         table-layout='fixed'
    
          :pagination="{
            total: total,
            pageSize: pageSize,
            current: currentPage,
            onChange: handlePageChange
          }"
        >
          <template #operation="{ row }">
            <t-button
              size="small"
              variant="text"
              @click="handleEdit(row.id)"
            >
              编辑
            </t-button>
            <t-button
              size="small"
              variant="text"
              theme="danger"
              @click="handleDelete(row.id)"
            >
              删除
            </t-button>
          </template>
        </t-table>
      </div>
    </div>
  </PageProvider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { PageProvider } from '@/components/page-provider';
import { useRequest } from '@/hooks/useRequest';
import { Message, MessagePlugin,Dialog,DialogPlugin } from 'tdesign-vue-next';
import type { TdPrimaryTableProps } from 'tdesign-vue-next';

const router = useRouter();

// 搜索表单
const searchForm = ref({
  username: '',
  name: '',
  status: ''
});

// 分页
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

// 选中行
const selectedRows = ref<any[]>([]);

// 用户列表数据
const userList = ref<any[]>([]);

// 表格列配置
const columns = [
  {
    type: 'checkbox',
    width: 40,
    fixed: 'left'
  },
  {
    title: 'ID',
    colKey: 'id',
    width: 80
  },
  {
    title: '用户名',
    colKey: 'username',
    width: 120
  },
  {
    title: '姓名',
    colKey: 'name',
    width: 120
  },
  {
    title: '邮箱',
    colKey: 'email',
    width: 200
  },
  {
    title: '角色',
    colKey: 'role',
    width: 120,
    cell: (h: any, { row }: any) => {
      const roleMap = { admin: '管理员', user: '普通用户' };
      return roleMap[row.role] || row.role;
    }
  },
  {
    title: '状态',
    colKey: 'status',
    width: 120,
    cell: (h: any, { row }: any) => {
      const statusMap = { draft: '草稿', publish: '发布' };
      return statusMap[row.status] || row.status;
    }
  },
  {
    title: '创建时间',
    colKey: 'createTime',
    width: 160,
    cell: (h: any, { row }: any) => {
      return row.createTime ? new Date(row.createTime).toISOString().split('T')[0] : '';
    }
  },
  {
    title: '更新时间',
    colKey: 'updateTime',
    width: 160,
    sorter: true,
    defaultSortOrder: 'descend',
    cell: (h: any, { row }: any) => {
      return row.updateTime ? new Date(row.updateTime).toISOString().split('T')[0] : '';
    }
  },
  {
    title: '操作',
    colKey: 'operation',
    width: 120,
    fixed: 'right',
    align: 'center'
  }
];

// 获取用户列表
const fetchUserList = async () => {
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...searchForm.value
    };
    // 这里使用mock数据，实际项目中替换为真实API调用
    // const response = await request.get('/api/users', { params });
    // userList.value = response.data.list;
    // total.value = response.data.total;
    
    // Mock数据
    userList.value = Array.from({ length: 20 }, (_, index) => ({
      id: (currentPage.value - 1) * 20 + index + 1,
      username: `user${(currentPage.value - 1) * 20 + index + 1}`,
      name: `用户${(currentPage.value - 1) * 20 + index + 1}`,
      email: `user${(currentPage.value - 1) * 20 + index + 1}@example.com`,
      role: index % 2 === 0 ? 'admin' : 'user',
      status: index % 2 === 0 ? 'publish' : 'draft',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }));
    total.value = 100;
  } catch (error) {
    console.error('获取用户列表失败:', error);
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchUserList();
};

// 重置表单
const resetForm = () => {
  searchForm.value = {
    username: '',
    name: '',
    status: ''
  };
  currentPage.value = 1;
  fetchUserList();
};

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchUserList();
};

// 新增用户
const handleAdd = () => {
  router.push('/user/edit');
};

// 编辑用户
const handleEdit = (id: number) => {
  router.push(`/user/edit/${id}`);
};

// 删除用户
const handleDelete = (id: number) => {
  // 二次确认
  DialogPlugin.confirm({
    header: '确认删除',
    body: '确定要删除该用户吗？',
    cancelBtn: '取消',
    confirmBtn: '确定',
    onConfirm: async () => {
      try {
        // 实际项目中替换为真实API调用
        // await request.delete(`/api/users/${id}`);
        console.log('删除用户:', id);
        await fetchUserList();
        MessagePlugin.success('删除成功');
      } catch (error) {
        console.error('删除失败:', error);
        MessagePlugin.error('删除失败');
      }
    }
  });
};

// 导出
const handleExport = () => {
  console.log('导出用户列表');
  // 实际项目中替换为真实的导出逻辑
};

// 初始化
onMounted(() => {
  fetchUserList();
});
</script>

<style scoped lang="less">
.user-list {
  padding: 24px;
  width: 100%;
  overflow-x: auto;
}

.page-header {
  margin-bottom: 24px;
  .page-header__title {
    margin-bottom: 16px;
  }
}

.search-form {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 24px;
}

.action-buttons {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
}

.data-table {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style>