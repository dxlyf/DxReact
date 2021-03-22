let isLogin = false;
export default {
  '/api/users/getCurrentUser': (req: any, res: any) => {
    if (isLogin) {
      res.json({
        success: true,
        code: 0,
        data: {
          userId: 'admin',
          userName: 'admin',
          permissions: ['0', '1'], // 权限列表
        },
      });
    } else {
      res.json({
        success: true,
        code: 1,
        message: '没有登录',
      });
    }
  },
  'POST /api/users/logout': (req: any, res: any) => {
    isLogin = false;
    res.json({
      success: true,
      code: 0,
    });
  },
  'POST /api/users/login': (req: any, res: any) => {
    isLogin = false;
    if (req.body.userName == 'admin' && req.body.password == 'admin') {
      isLogin = true;
      res.json({
        success: true,
        code: 0,
        data: {
          userId: 'admin',
          userName: 'admin',
          permissions: ['0', '1'], // 权限列表
        },
      });
    } else {
      res.json({
        success: false,
        code: 1,
        message: '用户名或密码不正确',
      });
    }
  },
  'POST /api/users/getUserList': (req: any, res: any) => {
    res.json({
      success: true,
      code: 0,
      data: {
        total: 2,
        list: [
          {
            id: 1,
            userId: 'admin',
            userName: 'admin',
          },
          {
            id: 2,
            userId: 'test',
            userName: 'test',
          },
        ],
      },
    });
  },
};
