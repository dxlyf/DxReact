import React from 'react';
import { Inspector,InspectParams } from 'react-dev-inspector';

// const InspectorWrapper =
//   process.env.NODE_ENV === 'development' ? Inspector : React.Fragment;
  const isDev = process.env.NODE_ENV === 'development'
const Layout: React.FC = ({ children }) => {
  return <Inspector disableLaunchEditor={!isDev} onClickElement={(inspect: InspectParams) => {
    console.debug(inspect)
    if (isDev || !inspect.codeInfo?.relativePath) return

  }}>{children}</Inspector>;
};

export default Layout;
