/**
 * 权限检查
 * @author fanyonglong
 */
import React, { FC } from 'react';

type authorityList = any[];
let CURRENT_USER_AUTHORITY: authorityList = []; // 当前登录用户权限列表

export const checkPermissions = <T, K>(
  authority: authorityList,
  currentAuthority: any,
  yesAuthority: T,
  noAuthority: K,
): T | K => {
  if (!currentAuthority) {
    return noAuthority;
  }
  if (Array.isArray(currentAuthority)) {
    if (
      currentAuthority.length > 0 &&
      currentAuthority.some((auth) => authority.indexOf(auth) !== -1)
    ) {
      return yesAuthority;
    }
  } else {
    if (authority.indexOf(currentAuthority) !== -1) {
      return yesAuthority;
    }
  }
  return noAuthority;
};
type AuthorizedProps = {
  authority: any;
  noMatch?: any;
  share?: boolean;
};
const Authorized: FC<AuthorizedProps> = ({
  children,
  share = false,
  authority,
  noMatch = null,
}) => {
  if (!share) {
    return checkAuthorize(authority, children, noMatch);
  }
  return React.Children.map(children, (child, index) => {
    let currentAuthority = authority[index];
    if (currentAuthority === null) {
      return child;
    }
    return checkAuthorize(currentAuthority, child, noMatch);
  });
};
export const setCurrentUserAuthority = (
  currentUserAuthority: authorityList,
) => {
  CURRENT_USER_AUTHORITY = currentUserAuthority;
};

export const checkAuthorize = (
  currentAuthority: any,
  yesAuthority: any = true,
  noAuthority: any = false,
) => {
  return checkPermissions(
    CURRENT_USER_AUTHORITY,
    currentAuthority,
    yesAuthority,
    noAuthority,
  );
};

export default Authorized;
