import { createI18n } from 'vue-i18n'

import en from './locales/en'
import zhCN from './locales/zh'

export const  SUPPORT_LOCALES = [
    {
      value: 'zh-CN',
      label: '中文'
    },
    {
      value: 'en',
      label: 'English'
    }
] as const
export type SupportLocale=typeof SUPPORT_LOCALES[number]['value']
const DEFAULT_LOCALE='zh-CN'
const LOCALE_KEY='sys_lang'
export const getStorageLocale = () => {
  const lang= localStorage.getItem(LOCALE_KEY)
  if(lang&&SUPPORT_LOCALES.some(item=>item.value===lang)){
    return lang
  }
  return DEFAULT_LOCALE
}
const i18n = createI18n({
  locale: getStorageLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  legacy:false,
  messages: {
    'en': en,
    'zh-CN': zhCN,
  }
})

export const setLocale = (locale: SupportLocale) => {
  i18n.global.locale.value = locale
  
  localStorage.setItem(LOCALE_KEY, locale)
}
export const getLocale = () => {
  return i18n.global.locale.value
}
export const t = (key: string) => {
  return i18n.global.t(key)
}
export default i18n