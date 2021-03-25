import { set, get } from 'lodash'
const SYSTEM_USER_DATA = 'SYSTEM_USER_DATA'

class StorgaData<T>{
    data: { [key in string]: any }
    constructor(private key: string) {
        this.data = {}
        this.refresh()
    }
    refresh() {
        try {
            let data = localStorage.getItem(this.key)
            if (data) {
                this.data = JSON.parse(data)
            }
        } catch (e) {

        }
    }
    save() {
        localStorage.setItem(this.key, JSON.stringify(this.data))
    }
    set(name: string, value: any)  {
        if(value===null||value===undefined){
            delete this.data[name]
        }else{
            this.data[name] = value
        }
        this.save()
    }
    get(name: string) {
        return this.data[name]
    }
    setData(data: T) {
        this.data = data
        this.save()
    }
    getData() {
        return this.data
    }
}
class App {
    clientType: number = 1 // 客户端类型（1-运营后台,2-小程序，3-骑手APP,4-门店APP）
    storage: StorgaData<{ token: string }>
    constructor() {
        this.storage= new StorgaData(SYSTEM_USER_DATA)
    }
    setToken(token: any) {
       this.storage.set('token',token)
    }
    getToken(token: string) {
        return this.storage.get('token')
    }
}

export default new App()