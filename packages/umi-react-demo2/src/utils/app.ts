/**
 * 全局应用配置
 * 全局单例实例
 * @author fanyonglong
 */
import {history} from 'umi'
import {stringify} from 'querystring'
import {SYSTEM_USER_DATA,SYSTEM_LOGIN_PAGE,SYSTEM_LOGIN_TOKEN} from '@/constants'

class StorgaData<T> {
  data: { [key in string]: any };
  constructor(private key: string) {
    this.data = {};
    this.refresh();
  }
  refresh() {
    try {
      let data = localStorage.getItem(this.key);
      if (data) {
        this.data = JSON.parse(data);
      }
    } catch (e) {}
  }
  save() {
    localStorage.setItem(this.key, JSON.stringify(this.data));
  }
  set(name: string, value: any) {
    if (value === null || value === undefined) {
      delete this.data[name];
    } else {
      this.data[name] = value;
    }
    this.save();
  }
  get(name: string) {
    return this.data[name];
  }
  setData(data: T) {
    this.data = data;
    this.save();
  }
  getData() {
    return this.data;
  }
}
class App {
  clientType: number = 1; // 客户端类型（1-运营后台,2-小程序，3-骑手APP,4-门店APP）
  storage: StorgaData<{ token: string }>;
  resourceConfig: any;
  private _currentUser: any;
  constructor() {
    this.storage = new StorgaData(SYSTEM_USER_DATA);
    this.resourceConfig = {};
  }
  set currentUser(value) {
    this._currentUser = value;
  }
  get currentUser() {
    return this._currentUser;
  }
  get imageDomain() {
    return this.resourceConfig.imageUrl;
  }
  toImageUrl(relativeUrl: string) {
    return (
      this.imageDomain +
      ((relativeUrl + '')[0] == '/' ? relativeUrl : '/' + relativeUrl)
    );
  }
  setToken(token: any) {
    this.storage.set(SYSTEM_LOGIN_TOKEN, token);
  }
  getToken() {
    return this.storage.get(SYSTEM_LOGIN_TOKEN);
  }
  goLogin(){
    history.push(
      `${SYSTEM_LOGIN_PAGE}?${stringify({
        redirect: window.location.pathname,
      })}`,
    );
  }
}

export default new App();
