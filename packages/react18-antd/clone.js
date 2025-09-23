import {exec,execFile,spawn,fork} from 'node:child_process'

const repository='git@github.com:react-component/'
const tasks=['context', 'mini-decimal', 'mutate-observer', 'portal', 'tour', 'async-validator', 'dom-align', 'rc-align', 'rc-banner-anim', 'rc-calendar', 'rc-cascader', 'rc-checkbox', 'rc-collapse', 'rc-dialog', 'rc-drawer', 'rc-dropdown', 'rc-field-form', 'rc-footer', 'rc-form', 'rc-gesture', 'rc-image', 'rc-input', 'rc-input-number', 'rc-mentions', 'rc-menu', 'rc-motion', 'rc-notification', 'rc-overflow', 'rc-pagination', 'rc-picker', 'rc-progress', 'rc-resize-observer', 'rc-resize-observer', 'rc-segmented', 'rc-select', 'rc-slider', 'rc-steps', 'rc-swipeout', 'rc-switch', 'rc-table', 'rc-tabs', 'rc-textarea', 'rc-texty', 'rc-time-picker', 'rc-tooltip', 'rc-touchable', 'rc-tree', 'rc-tree-select', 'rc-trigger', 'rc-tween-one', 'rc-upload', 'rc-util', 'rc-virtual-list', 'rmc-calendar', 'rmc-date-picker', 'rmc-dialog', 'rmc-drawer', 'rmc-input-number', 'rmc-list-view', 'rmc-picker', 'rmc-pull-to-refresh', 'rmc-pull-to-refresh', 'rmc-tabs']

const maxExecuteCount=5;

async function clone(){
    try{
        const execTask=(i)=>{
          return new Promise((resolve,reject)=>{
            let name=tasks[i]
            let child=exec(`git clone --depth=1 ${repository}/${name}.git`,(error)=>{
                if(error){
                    console.log('仓库：'+name+',克隆失败')
                    reject(error)
                    return
                }
                  console.log('仓库：'+name+',克隆成功')
                  resolve()
            },{
                cwd:process.cwd(),
                stdout:process.stdout
            })
            
          })
        }
        const nextTask=()=>{
            if(curIndex<tasks.length){
                execTask(curIndex++).finally(nextTask)
            }
        }
        let curMaxExecuteCount=maxExecuteCount
        let curIndex=0
        while(i<curMaxExecuteCount){
            nextTask()
        }

    }catch(e){

    }
}

exec