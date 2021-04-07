import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Button, message, Space, Select, Form } from 'antd';
import ProForm, {
  ModalForm,
  ProFormText,
  ProFormSelect,
} from '@ant-design/pro-form';
import { getModelGroupById } from '@/services/material';
import { useRequest } from 'ahooks';
import { useImmer } from 'use-immer';

const { Option } = Select;

function handleValueEnum(data) {
  const valueEnum: any = {};
  data.forEach(({ id, name }) => {
    valueEnum[id] = name;
  });
  return valueEnum;
}

const GroupSelect = (props, ref) => {
  const {} = props;

  const [form] = Form.useForm();

  const [state, setState]: any = useImmer({
    first: {
      data: [],
      value: '',
    },
    second: {
      data: [],
      value: '',
    },
  });

  const reqGetModelGroupById = useRequest(getModelGroupById, {
    manual: true,
    initialData: [],
    formatResult: (result: any) => {
      return result.data;
    },
    onSuccess: (data, params) => {
      let keyName = 'second';

      // pid为0是第一层数据
      if (params[0].pid === 0) {
        keyName = 'first';
      }
      // console.log(
      //   '🚀 ~ file: GroupSelect.tsx ~ line 58 ~ GroupSelect ~ keyName',
      //   keyName,
      //   handleValueEnum(data),
      // );

      setState((draft) => {
        draft[keyName].data = handleValueEnum(data);
      });
    },
  });

  useEffect(() => {
    reqGetModelGroupById.run({
      pid: 0,
    });
  }, []);

  useEffect(() => {
    if (state.first.value) {
      reqGetModelGroupById.run({
        pid: state.first.value,
      });
    }
  }, [state.first.value]);

  // const handleSearch = (value, type) => {
  //   if (value) {
  //     // fetch(value, (data) => this.setState({ data }));
  //     // reqGetModelGroupById.run({ pid: 1 });
  //   } else {
  //     setState((draft) => {
  //       draft[type].data = [];
  //     });
  //   }
  // };

  const handleChange = (value, type) => {
    setState((draft) => {
      draft[type].value = value;
    });
  };

  return (
    <Form>
      <ProFormSelect
        name="first"
        label="第一级分组"
        valueEnum={state.first.data}
        placeholder="请输入第一级分组"
        rules={[{ required: true, message: '请输入第一级分组' }]}
      />
      <ProFormSelect
        name="second"
        label="第二级分组"
        valueEnum={state.second.data}
        placeholder="请输入第二级分组"
        rules={[{ required: true, message: '请输入第二级分组' }]}
      />
    </Form>
  );
};

export default GroupSelect;
