import { createI18n } from 'vue-i18n'


export const getLangList = () => {
  return [
    {
      value: 'zh-CN',
      content: 'zh-CN'
    },
    {
      value: 'en',
      content: 'en-US'
    }
  ]
}
const i18n = createI18n({
  locale: localStorage.getItem('lang') || 'zh-CN',
  fallbackLocale: 'zh-CN',
  legacy:false,
  messages: {
    'en': {
      message: {
        hello: 'hello world',
        unauthorized:'unauthorized',
      },
        pages: {
        result: {
          '404': {
            title: '404 Not Found',
            subtitle: 'The page you visited does not exist',
            back: 'Back to Home'
          }
        }
      }
    },
    'zh-CN': {
      message: {
        hello: '你好，世界',
        unauthorized:'未授权',
      },
      pages: {
        result: {
          '404': {
            title: '404 Not Found',
            subtitle: '抱歉，页面不存在',
            back: '返回首页'
          }
        }
      }
    }
  }
})
export const t = (key: string) => {
  return i18n.global.t(key)
}
export default i18n