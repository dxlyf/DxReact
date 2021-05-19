import { useEffect } from 'react';
import { message, Form } from 'antd';

import { ModalForm, ProFormSelect } from '@ant-design/pro-form';
import { getModelGroupById } from '@/services/material';
import { useRequest } from 'ahooks';
import { useImmer } from 'use-immer';
import { useResetFormOnCloseModal } from '../../components/utils';
import { batchUpdateGroup } from '@/services/diyModel';
import { checkAuthorize } from '@/components/Authorized';

function handleValueEnum(data) {
  const valueEnum: any = {};
  data.forEach(({ id, name }) => {
    valueEnum[id] = name;
  });
  return valueEnum;
}

const BatchModal = (props) => {
  const { onCancel, visible, width, ids, callback } = props;

  const [form] = Form.useForm();

  const [state, setState]: any = useImmer({
    topModelGroupId: {
      data: [],
    },
    modelGroupId: {
      data: [],
    },
  });

  const reqGetModelGroupById = useRequest(getModelGroupById, {
    manual: true,
    refreshDeps: [form.getFieldValue('topModelGroupId')],
    onSuccess: (data: any, params) => {
      let keyName = 'modelGroupId';
      let arr: any = [...data];

      // pid为0是第一层数据
      if (params[0].pid === '0') {
        keyName = 'topModelGroupId';
        // 使用第三方模型制作权限账号不让编辑标准库
        if (!checkAuthorize(['admin'])) {
          arr = arr.filter((item) => item.id === 2);
        }
      }

      setState((draft) => {
        draft[keyName].data = arr ? handleValueEnum(arr) : [];
      });
    },
  });

  const reqBatchUpdateGroup = useRequest(batchUpdateGroup, {
    manual: true,
  });

  useResetFormOnCloseModal({
    form,
    visible,
  });

  useEffect(() => {
    if (visible) {
      reqGetModelGroupById.run({
        pid: '0',
      });
    }
  }, [visible]);

  if (!ids || ids.length === 0) {
    return null;
  }

  return (
    <ModalForm
      form={form}
      width={width}
      title="批量修改分组"
      visible={visible}
      // visible={true}
      onFinish={async ({ topModelGroupId, modelGroupId }) => {
        await reqBatchUpdateGroup.run({
          topModelGroupId,
          modelGroupId,
          ids,
        });
        message.success('修改成功！');
        if (callback) {
          callback();
        }
        return true;
      }}
      onValuesChange={(changeValues) => {
        if (changeValues.topModelGroupId) {
          reqGetModelGroupById.run({
            pid: changeValues.topModelGroupId,
          });
        }
      }}
      onVisibleChange={onCancel}
    >
      <ProFormSelect
        name="topModelGroupId"
        label="第一级分组"
        valueEnum={state.topModelGroupId.data}
        placeholder="请输入第一级分组"
        rules={[{ required: true, message: '请输入第一级分组' }]}
      />
      <ProFormSelect
        name="modelGroupId"
        label="第二级分组"
        valueEnum={state.modelGroupId.data}
        placeholder="请输入第二级分组"
        rules={[{ required: true, message: '请输入第二级分组' }]}
      />
    </ModalForm>
  );
};

export default BatchModal;
