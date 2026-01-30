import vuei18n from 'vue-i18n'


const i18n=vuei18n.createI18n({
    locale: 'zh-CN',
    messages: {
      'en': {
        message: {
          hello: 'hello world'
        }
      },
      'zh-CN': {
        message: {
          hello: '你好，世界'
        }
      }
    }
})
export const t=(key:string)=>{
  return i18n.global.t(key)
}
export default i18n