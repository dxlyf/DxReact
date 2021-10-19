import React from 'react';
import { Result, Button } from 'antd';
import { Link } from 'umi';

const Status_404 = () => {
  return (
    <Result
      status={404}
      title="404"
      subTitle="对不起,您的访问的页面找不到"
      extra={
        <Button type="primary">
          <Link to="/">返回</Link>
        </Button>
      }
    />
  );
};
export default Status_404;
