import { computed, createApp,h,defineComponent,getCurrentInstance } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import {DatePicker} from 'tdesign-vue-next'
import TDesign from 'tdesign-vue-next/esm'
// import 'tdesign-vue-next/esm/style/index.js'
import 'tdesign-vue-next/es/style/index.css'
import i18n from './i18n'
import './style.css'
import './styles/index.less'
import './utils/app'
import dayjs from 'dayjs';
const app = createApp(App)
app.use(i18n)
app.use(router)
app.use(pinia)
app.use(TDesign)
app.use(Antd)

app.mount('#app')
// app.component('TDatePicker',defineComponent({
//         name:'TDatePicker',
//         setup(props,{attrs}){
//           return ()=>h(DatePicker,{
//             defaultTime:dayjs().format('HH:mm:ss'),
//             ...(attrs||{})
//           })
//         }
// }))
app.mixin({
    beforeCreate(){
        if(this.$options.name==="TDatePicker"){
           console.log('beforeCreate',this.$.vnode)
           this._.vnode.component.props.defaultTime=dayjs().format('HH:mm:ss')
           debugger
           this._.vnode.component.props.clearable=true
        }
    },
    updated(){
        if(this.$options.name==="TDatePicker"&&this.format==='YYYY-MM-DD HH:mm:ss'&&!this.modelValue){
          this._.vnode.component.props.defaultTime=dayjs().format('HH:mm:ss')
        }
    },
    mounted(){
        if(this.$options.name==="TDatePicker"&&this.format==='YYYY-MM-DD HH:mm:ss'){
            //console.log(this.$options.name,dayjs().format('YYYY-MM-DD HH:mm:ss'))
            if(!this.defaultValue&&this.defaultTime=='00:00:00'){
               //this.$.vnode.component.props.defaultTime=dayjs().format('HH:mm:ss')
               // this.defaultValue=dayjs().format('YYYY-MM-DD HH:mm:ss')
               //console.log('fffffffffff')
              //this.$.vnode.props.defaultTime=dayjs().format('HH:mm:ss')
            //  this.$.propsOptions[0].defaultTime.default=dayjs().format('HH:mm:ss')
            //debugger
             //  this.$forceUpdate()
               //const instance=getCurrentInstance()
               //this.$.update()
            }
         //   this.$.vnode.props.defaultTime=dayjs().format('HH:mm:ss')
          //  this.modelValue=dayjs().format('YYYY-MM-DD HH:mm:ss')
           //this.$options.props.defaultTime.default=dayjs().format('HH:mm:ss')
           // this.defaultTime=computed(()=>dayjs().format('HH:mm:ss'))
        }
    }
})
