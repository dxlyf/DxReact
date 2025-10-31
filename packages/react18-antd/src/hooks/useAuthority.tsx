import { useCallback, useMemo } from "react";

/**
 * 用于 useBusinssTable
 * permissionCodeSet是一个打平的资源码集，不再依赖父级
 * 支持代码块的权限控制：
 *
 * const authority=useAuthority()
 * @examples
 * 
 * const config=authority.when('config',{    
 * },null)
 * <Space><Button style={{display:authority.when('add','block','none')}}>新增</Button></Space>
 * 
 * <Space>{authority.has('add')?<Button>新增</Button>:null}</Space>
 * <Space>{authority.single(<Button>新增</Button>,'add')}</Space>
 * <Space>{authority.single(<list></list>,'view',<div>无权限查看</div>)}</Space>
 *  
 * <Space>{authority.array(<Button>新增</Button><<Button>编辑</Button>>,['add','edit])}</Space>
 * <Space>{authority.array(<Button>新增</Button><<Button>编辑</Button>>,[['add'],'edit',<Button>查看</Button>])}</Space>
 */

export const permissions=[]
export const useAuthority = () => {
  const [userState]: any = store.useModel('user');
  const permissionCodeSet = useMemo<Set<string>>(() => {
    return new Set(Utils.flatTree(userState.menuAndBtnList).map((d) => d.resourceCode));
  }, [userState.menuAndBtnList]);
  
  // 如果是权限码数组， 有一人存在就会显示
  const hasPermission = useCallback(
    (codeAndCodeList?: string | string[]) => {
      if (codeAndCodeList === void 0) {
        return true;
      }
      if (Array.isArray(codeAndCodeList)) {
        return codeAndCodeList.some((code) => permissionCodeSet.has(code));
      }
      return permissionCodeSet.has(codeAndCodeList);
    },
    [permissionCodeSet],
  );
  const  when= useCallback(
    (code: string|string[],success:any,fail?:any) => {
      return hasPermission(code) ? success : fail;
    },
    [hasPermission],
  );
  const renderSingle = useCallback(
    (children: React.ReactElement, code: string, notAuthNode: React.ReactNode = null): React.ReactNode => {
      return hasPermission(code) ? children : notAuthNode;
    },
    [hasPermission],
  );

   const renderArray = useCallback(
    (
      children: React.ReactElement[],
      codeList: string[] | [string, React.ReactNode][],
      defaultNotAuthNode: React.ReactNode = null,
    ): React.ReactNode => {
      if (children.length !== codeList.length) {
        throw '权限码与元素长度不一致';
      }
      return children.map((child, index) => {
        const arr = (typeof codeList[index] === 'string' ? [codeList[index], defaultNotAuthNode] : codeList[index]) as [
          string,
          React.ReactNode,
        ];
        return hasPermission(arr[0]) ? child : arr[1];
      });
    },
    [hasPermission],
  );
  const instance = useMemo(
    () => ({
      permissionCodeSet,
      when,
      has: hasPermission,
      single: renderSingle,
      array: renderArray,
    }),
    [permissionCodeSet,when, hasPermission, renderSingle, renderArray],
  );
  return instance;
};