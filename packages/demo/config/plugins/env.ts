import { IApi } from '@umijs/types';
import inquirer from 'inquirer';

export default (api: IApi) => {
  api.describe({
    key: 'envConfig',
    enableBy: api.EnableBy.config,
    config: {
      schema(joi) {
        return joi.object({
          env: joi.object(),
          config: joi.function(),
        });
      },
      default: {
        env: {},
        config: null,
      },
    },
  });

  api.onStart(async ({ args }) => {
    let envConfig = api.config.envConfig.env;
    let getConfig = api.config.envConfig.config;
    try {
      let res = await inquirer.prompt([
        {
          name: 'env',
          type: 'list',
          choices: Object.keys(envConfig),
          message: '请选择环境',
          validate: (value: any) => {
            if (!value) {
              return '环境不能为空';
            }
            return true;
          },
        },
      ]);
      api.modifyConfig((memo) => {
        let newConfig =
          (getConfig && getConfig(res.env, envConfig[res.env])) || {};
        return {
          ...memo,
          ...newConfig,
        };
      });
      let newConfig =
        (getConfig && getConfig(res.env, envConfig[res.env])) || {};
      api.service.config = api.utils.mergeConfig(
        {},
        api.config,
        newConfig,
      ) as any;
    } catch (e) {}
  });
};
