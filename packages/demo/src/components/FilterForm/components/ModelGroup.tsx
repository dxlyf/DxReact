import React, { useEffect, useState } from 'react';
import { Cascader } from 'antd';
import { getDIYModelGroupTreeList } from '@/services/product';

const fieldNames = { label: 'name', value: 'id' };
const ModelGroupCascader = React.memo(
  React.forwardRef((props, ref) => {
    let [data, setData] = useState<any>([]);
    useEffect(() => {
      getDIYModelGroupTreeList().then((data) => {
        setData(data);
      });
    }, []);
    return (
      <Cascader
        changeOnSelect
        fieldNames={fieldNames}
        options={data}
        {...props}
      ></Cascader>
    );
  }),
);

export default ModelGroupCascader;
