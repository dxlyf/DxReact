import React, { useEffect, useState, useContext, useCallback,useMemo } from 'react';
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

const defaultDateRange=[
  { value: 0, date: [0, 0], text: '今天' },
  { value: 1, date: [-1, -1], text: '昨天' },
  { value: 2, date: [-6, 0], text: '近7天' },
  { value: 3, date: [-29, 0], text: '近30天' },
]
const DateRange = React.memo(
  React.forwardRef((props: any, ref) => {
    let { field, ...restProps } = props;
    let {
      initialValue,
      range:propsRange,
    } = field;
    let { form } = useContext(FilterContext);
    let range=useMemo(() =>propsRange?propsRange:defaultDateRange,[propsRange])
    let [currentDateRange, setCurrentDateRange] = useState(() => {
      if (range.length > 0) {
        return range[0];
      }
      return {};
    });
    initialValue =
      initialValue === undefined ? [moment(), moment()] : initialValue;
    let setCurrentDate = useCallback((currentRange) => {
      let date=currentRange.date
      let start = moment(),
        end = moment();
      start.add(Number(date[0]), 'd');
      end.add(Number(date[1]), 'd');
      form.setFieldsValue({
        [field.fieldName]: [start, end],
      });
    }, [range]);
    let onChangeDate = useCallback(
      (e) => {
        let currentRange=range.find(d=>d.value==e.target.value)
        setCurrentDate(currentRange);
        setCurrentDateRange(currentRange);
      },
      [setCurrentDate,range],
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
          <Radio.Group onChange={onChangeDate} value={currentDateRange.value}>
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
