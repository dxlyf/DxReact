import React, { useEffect, useState } from 'react';
import { Select } from 'antd';
import { getShopList } from '@/services/shop';

const ShopSelect = React.memo(
  React.forwardRef((props, ref) => {
    let [data, setData] = useState<any>([{ id: -1, name: '全部' }]);
    useEffect(() => {
      getShopList().then((data: any) => {
        setData([{ id: -1, name: '全部' }].concat(data));
      });
    }, []);
    return (
      <Select {...props}>
        {data.map((d: any) => (
          <Select.Option key={d.id} value={d.id}>
            {d.name}
          </Select.Option>
        ))}
      </Select>
    );
  }),
);
export default ShopSelect;
