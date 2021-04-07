import { useEffect } from 'react';
import { message, Modal, Form } from 'antd';
import { ProFormText } from '@ant-design/pro-form';
import { useRequest } from 'ahooks';
import { addModelGroup, editModelGroup } from '@/services/material';
import { useResetFormOnCloseModal } from '../../components/utils';

const EditModal = (props) => {
  const {
    onCancel,
    type,
    visible,
    width,
    id,
    pid,
    name,
    pidName,
    callback,
  } = props;

  const isCreate = type === 'create';
  const [form] = Form.useForm();

  const reqAddModelGroup = useRequest(addModelGroup, {
    manual: true,
    onSuccess: () => {
      message.success('添加成功！');
      onCancel();
      callback();
    },
  });
  const reqEditModelGroup = useRequest(editModelGroup, {
    manual: true,
    onSuccess: () => {
      message.success('修改成功！');
      onCancel();
      callback();
    },
  });

  useResetFormOnCloseModal({
    form,
    visible,
  });

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        name,
        pidName,
      });
    }
  }, [visible]);

  return (
    <Modal
      style={{ width: width }}
      title={`${isCreate ? '新建' : '编辑'}分组`}
      visible={visible}
      onOk={() => {
        form.submit();
      }}
      onCancel={onCancel}
      // confirmLoading={reqAddModelGroup.loading || reqEditModelGroup.loading}
    >
      <Form
        form={form}
        onFinish={(values) => {
          if (isCreate) {
            reqAddModelGroup.run({
              name: values.name,
              pid,
            });
          } else {
            reqEditModelGroup.run({
              name: values.name,
              id,
            });
          }
        }}
      >
        {isCreate && <ProFormText name="pidName" disabled label="上一级名称" />}
        <ProFormText
          name="name"
          label="分组名称"
          tooltip="最大50个字"
          placeholder="请输入分组名称"
          rules={[
            { required: true, message: '分组名称是必填项' },
            { max: 50, message: '不能输入超过50个字' },
          ]}
        />
      </Form>
    </Modal>
  );
};

export default EditModal;
