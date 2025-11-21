
type Ticker= {
    update(delta: number): boolean
}
class AnimationTicker {
    static instance: AnimationTicker=null
    static getInstance() {
       if(!this.instance) {
            this.instance = new AnimationTicker()
        }
        return this.instance
    }
    animationId: ReturnType<typeof requestAnimationFrame>
    animationRunning: boolean = false
    startTime = 0
    delta = 0
    lastTime = 0
    callbacks: Ticker[] = []
    constructor() {

    }
    start() {
        if (this.animationRunning) {
            return
        }

        this.animationRunning = true
        this.startTime = this.lastTime = performance.now()
        this.animationId = requestAnimationFrame(this.loop)
    }
    loop = (time: number) => {
        if (!this.animationRunning) {
            return
        }
        this.delta = time - this.lastTime
        this.lastTime = time
        this.update(this.delta)
        this.animationId = requestAnimationFrame(this.loop)
    }
    add(task: Ticker) {
        this.callbacks.push(task)
        if (!this.animationRunning) {
            this.start()
        }
    }
    remove(task:Ticker){
        const index=this.callbacks.indexOf(task)
        if(index>-1){
            this.callbacks.splice(index,1)
        }
    }
    update(delta: number) {
        const callbacks = this.callbacks
        let needUpdateCallbacks = false

        for (let i = 0; i < callbacks.length; i++) {
            if (callbacks[i]&&callbacks[i].update(delta) === false) {
                callbacks[i] = null
                needUpdateCallbacks=true
            }
        }
        if(needUpdateCallbacks){
            this.callbacks=this.callbacks.filter(Boolean)
        }
        if (this.callbacks.length === 0) {
            this.stop()
        }
        
    }
    stop() {
        this.animationRunning = false
        cancelAnimationFrame(this.animationId)
    }
}
class Animation{
    formProps:any
    toProps:any
    toKeys:string[]
    curProps:any
    duration:number=1000
    startTime:number=0
    delta:number=0
    elapsedTime:number=0
    lastTime:number=0
    easing:(t:number)=>number
    constructor(options:{}) {
    }
    from(fromProps:any) {

      this.formProps=Object.assign({},fromProps)
    }
    to(toProps:any) {
        this.toProps=Object.assign({},toProps)
        this.toKeys=Object.keys(this.toProps)
    }
    start(options:{duration?:number;easing?:(t:number)=>number}){
        this.curProps={}
        this.duration=options.duration||1000
        this.startTime=this.lastTime=Date.now()
        this.elapsedTime=0
        this.easing=options.easing||((t:number)=>t)
    }
    stop(){
        AnimationTicker.getInstance().remove(this)
    }
    lerp(a:number,b:number,t:number) {
        return a+(b-a)*t
    }
    update(delta:number){
        this.elapsedTime+=delta
        const rate=this.elapsedTime/this.duration
        const precent=Math.max(0,Math.min(1,rate))
        const t=this.easing(precent)
        this.toKeys.forEach(key=>{
            this.curProps[key]=this.formProps[key]+(this.toProps[key]-this.formProps[key])*t
        })

        return true
    }
}
const useAnimation = () => {

}

export default useAnimation