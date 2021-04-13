import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  Select,
  Form,
  Input,
  Dropdown,
  Menu,
  Space,
  DatePicker,
  Radio,
  Modal,
  Button,
} from 'antd';
import { useControllableValue } from 'ahooks';
import { FilterContext } from '../FilterContext';
import { get } from 'lodash';
import { useModal } from '@/common/hooks';
import { DownOutlined } from '@ant-design/icons';
import moment from 'moment';

const DateRange = React.memo(
  React.forwardRef((props: any, ref) => {
    let { field, ...restProps } = props;
    let { initialValue } = field;
    let { form } = useContext(FilterContext);
    let [modal, { show }] = useModal({});
    return (
      <Form.Item
        {...field.formItemProps}
        label={<div style={{ width: field.labelWidth }}>{field.label}</div>}
      >
        <Button onClick={show}>选择</Button>

        <Modal {...modal.props} title=""></Modal>
      </Form.Item>
    );
  }),
);
export default DateRange;
