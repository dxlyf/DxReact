import React from 'react';
import { Result, Button } from 'antd';
import { Link } from 'umi';

const Status_403 = () => {
  return (
    <Result
      status={403}
      title="403"
      subTitle="对不起,您没有权限访问"
      extra={
        <Button type="primary">
          <Link to="/">返回</Link>
        </Button>
      }
    />
  );
};
export default Status_403;
