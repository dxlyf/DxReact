import { ImmerReducer } from 'umi';
export interface GlobalModelState {
  settings: any;
}

export interface GlobalModelType {
  namespace: 'global';
  state: GlobalModelState;
  effects: {};
  reducers: {
    setState: ImmerReducer<GlobalModelState>;
  };
}
const UserModel: GlobalModelType = {
  namespace: 'global',
  state: {
    // pro-layout 配置
    settings: {
      navTheme: 'light', // 菜单的主题
      primaryColor: '#1890FF', // Ant Design 的主色调
      layout: 'sidemenu', // 菜单的布局，值为 sidemenu 菜单显示在左侧，值为 topmenu 菜单显示在顶部
      contentWidth: 'Fluid', // 内容的布局 Fixed 为定宽到1200px ，Fluid 为流式布局。
      fixedHeader: false, // 固定页头
      autoHideHeader: false, // 下滑时自动隐藏页头
      fixSiderbar: true, // 固定菜单
    },
  },
  effects: {},
  reducers: {
    setState(state, action) {},
  },
};
export default UserModel;
