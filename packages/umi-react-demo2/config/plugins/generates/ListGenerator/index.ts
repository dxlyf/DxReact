import { IApi } from '@umijs/types';
import { Generator, randomColor,prompts } from '@umijs/utils';
import { basename, join } from 'path';

export default function ({ api }: { api: IApi }) {
  return class ListGenerator extends Generator {
    constructor(opts: any) {
      super(opts);
    }
    prompting():Array<prompts.PromptObject<any>>{
        return [{
            name:"ffff",
            type:"list"
        }]
    }
    async writing() {
      const [path] = this.args._;
     
    }
  };
}
