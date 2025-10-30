 declare  global{
    interface PromiseConstructor{
        withResolvers:()=>({resolve:PromiseConstructor['resolve'],reject:PromiseConstructor['reject'],promise:Promise<unknown>})
    }
}

if(!Promise.withResolvers){
    Promise.withResolvers = function () {
        var rs:any, rj:any, pm = new this((resolve, reject) => {
            rs = resolve;
            rj = reject;
        });
        return {
            resolve: rs,
            reject: rj,
            promise: pm,
        };
    };
}