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
} from 'antd';
import { useControllableValue } from 'ahooks';
import { FilterContext } from '../FilterContext';
import { get } from 'lodash';
import { DownOutlined } from '@ant-design/icons';
import moment from 'moment';

const DateRange = React.memo(
  React.forwardRef((props: any, ref) => {
    let { field, ...restProps } = props;
    let {
      initialValue,
      range = [
        { value: 0, text: '今天' },
        { value: -1, text: '昨天' },
        { value: -6, text: '近7天' },
        { value: -29, text: '近30天' },
      ],
    } = field;
    let { form } = useContext(FilterContext);
    let [currentDateRange, setCurrentDateRange] = useState(() => {
      if (range.length > 0) {
        return range[0].value;
      }
      return 0;
    });
    initialValue =
      initialValue === undefined ? [moment(), moment()] : initialValue;
    let setCurrentDate = useCallback((value) => {
      let start = moment(),
        end = moment();
      start.add(Number(value), 'd');
      form.setFieldsValue({
        [field.fieldName]: [start, end],
      });
    }, []);
    let onChangeDate = useCallback(
      (e) => {
        setCurrentDate(e.target.value);
        setCurrentDateRange(e.target.value);
      },
      [setCurrentDate],
    );
    let disabledDate = useCallback((current) => {
      // Can not select days before today and today
      return current && current > moment().endOf('day');
    }, []);
    return (
      <Form.Item
        {...field.formItemProps}
        label={<div style={{ width: field.labelWidth }}>{field.label}</div>}
      >
        <Space>
          <Form.Item noStyle name={field.fieldName} initialValue={initialValue}>
            <DatePicker.RangePicker
              disabledDate={disabledDate}
              {...restProps}
            ></DatePicker.RangePicker>
          </Form.Item>
          <Radio.Group onChange={onChangeDate} value={currentDateRange}>
            {range.map((d) => (
              <Radio.Button value={d.value} key={d.value}>
                {d.text}
              </Radio.Button>
            ))}
          </Radio.Group>
        </Space>
      </Form.Item>
    );
  }),
);
export default DateRange;
