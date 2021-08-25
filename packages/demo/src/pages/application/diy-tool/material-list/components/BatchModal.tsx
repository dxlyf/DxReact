import { useEffect } from 'react';
import { message, Form } from 'antd';

import { ModalForm, ProFormSelect } from '@ant-design/pro-form';
import { getModelGroupById } from '@/services/material';
import { useRequest } from 'ahooks';
import { useImmer } from 'use-immer';
import { useResetFormOnCloseModal } from '../../components/utils';
import { batchUpdateGroup } from '@/services/diyModel';
import { checkAuthorize } from '@/components/Authorized';
import ModelGroup from '../../components/ModelGroup'

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

  const reqBatchUpdateGroup = useRequest(batchUpdateGroup, {
    manual: true,
  });

  useResetFormOnCloseModal({
    form,
    visible,
  });

  if (!ids || ids.length === 0) {
    return null;
  }

  return (
    <ModalForm
      form={form}
      width={width}
      title="批量修改分组"
      visible={visible}
      layout="horizontal"
      // visible={true}
      onFinish={async ({ modelGroupId }) => {
        await reqBatchUpdateGroup.run({
          topModelGroupId:modelGroupId[0],
          modelGroupId:modelGroupId[modelGroupId.length-1],
          ids,
        });
        message.success('修改成功！');
        if (callback) {
          callback();
        }
        return true;
      }}
      onVisibleChange={onCancel}
    >
     <Form.Item label="所属分组" name="modelGroupId" rules={[{
                        required:true,
                        type:"array",
                        min:1,
                        message:'请选择所属分组'
                    }]}><ModelGroup></ModelGroup></Form.Item>
    </ModalForm>
  );
};

export default BatchModal;
