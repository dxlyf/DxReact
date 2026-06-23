/**
 * 应用初始环境配置
 */
export class App{
    static instance: App
    static getSingleton(){
        if(!this.instance){
            this.instance = new App()
        }
        return this.instance
    }
    initialized: boolean = false
    constructor(){

    }
    async initialize(){
        if(this.initialized){
            return
        }
        // 初始化应用环境，例如配置全局变量、加载初始数据等
        // 这里只是一个示例，你可以根据实际需求进行修改
        console.log('应用环境初始化完成')
        this.initialized = true
    }
    
}

export default App.getSingleton()
