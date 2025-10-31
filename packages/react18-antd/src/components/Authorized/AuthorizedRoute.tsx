// import { Redirect, Route } from 'umi';

import React from 'react';
import Authorized from './Authorized';
import {type IAuthorityType } from './CheckPermissions';
import {Navigate,Route} from 'react-router-dom'
interface AuthorizedRoutePops {
  currentAuthority: string;
  component: React.ComponentClass<any, any>;
  render: (props: any) => React.ReactNode;
  redirectPath: string;
  authority: IAuthorityType;
}

const AuthorizedRoute: React.FC<AuthorizedRoutePops> = ({
  component: Component,
  render,
  authority,
  redirectPath,
  ...rest
}) => (
  <Authorized
    authority={authority}
    noMatch={<Route {...rest} element={<Navigate to={{ pathname: redirectPath }} />} />}
  >
    <Route
      {...rest}
      element={Component ? <Component {...rest} /> : render(rest)}
    />
  </Authorized>
);

export default AuthorizedRoute;
