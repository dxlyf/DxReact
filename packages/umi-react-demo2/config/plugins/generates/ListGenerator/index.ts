import {IApi} from 'umi'
import {Generator,prompts} from '@umijs/utils'
export default function create({ api }:{api:IApi}) {
    return class ListGenerator extends Generator{
        constructor(opts:any){
            super(opts)
        }
        prompting():Array<prompts.PromptObject<any>>{
            return [
                {
                    type:"text",
                    hint:"路径",
                    name:"path"
                }
            ]
        }
        async writing(){
            
        }
    }
}
