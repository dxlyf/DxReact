import React from 'react';
import { Inspector,InspectParams } from 'react-dev-inspector';
import {IS_DEVELOPMENT} from '@/constants'
// const InspectorWrapper =
//   process.env.NODE_ENV === 'development' ? Inspector : React.Fragment;
const Layout: React.FC = ({ children }) => {
  return <Inspector disableLaunchEditor={!IS_DEVELOPMENT} onClickElement={(inspect: InspectParams) => {
    console.debug('Inspector',inspect)
    if (IS_DEVELOPMENT || !inspect.codeInfo?.relativePath) return
  }}>{children}</Inspector>;
};

export default Layout;
