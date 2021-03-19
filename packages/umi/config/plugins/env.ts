import { IApi } from '@umijs/types';
import inquirer from 'inquirer'

export default (api: IApi) => {
  
    async function startServer(args:any) {
        let envConfigs=api.config.envConfig.env
        let proxy=api.config.envConfig.proxy
        try{
            let res=await inquirer.prompt([
                {
                    name:"env",
                    type:"list",
                    choices:Object.keys(envConfigs),
                    message:"请选择环境",
                    validate:(value:any)=>{
                            if(!value){
                                return '环境不能为空'
                            }
                            return true
                        }
                },
                {
                    name:"run",
                    type:"list",
                    default:"dev",
                    message:"启动环境",
                    choices:['dev','prod']
                }
            ])

            api.modifyConfig((memo) => {
                return {
                  ...memo,
                  define:{
                    SYSTEM_API_ENV_NAME:res.env,
                    SYSTEM_API_ENV_VALUE:envConfigs[res.env]
                  },
                  proxy:proxy?proxy(res.env,envConfigs[res.env]):{}
                };
            });
            if(res.run==='dev'){
                api.service.runCommand({name:"dev",args:args})
            }else if(res.run==='build'){
                api.service.runCommand({name:"build",args:args})
            }

        }catch(e){

        }
    }
    api.describe({
        key:"envConfig",
        config:{
            schema(joi) {
                return joi.object({
                    env:joi.object(),
                    config:joi.function()
                });
            },
            default:{
                env:{},
                config:null
            }
        }
    })
  
    api.onStart(async ({args})=>{
        let envConfig=api.config.envConfig.env
        let getConfig=api.config.envConfig.config
        try{
            let res=await inquirer.prompt([
                {
                    name:"env",
                    type:"list",
                    choices:Object.keys(envConfig),
                    message:"请选择环境",
                    validate:(value:any)=>{
                            if(!value){
                                return '环境不能为空'
                            }
                            return true
                        }
                }
            ])
            api.modifyConfig((memo) => {
                let newConfig=getConfig(res.env,envConfig[res.env])||{}
                return {
                  ...memo,
                  ...newConfig
                };
            });
        }catch(e){}
    })
    api.registerCommand({
        name:"env",
        fn:async ({args})=>{
           await startServer(args)
        }
    })
};
