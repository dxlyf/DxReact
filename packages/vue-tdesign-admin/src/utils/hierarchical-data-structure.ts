
export const convertFlatToTree=<T extends Record<string,any>>(flat:T[],options:{
    hasParent:(item:T)=>boolean
    parentIdKey:string
    primaryKey:string
    childrenKey:string
})=>{
    const {hasParent,parentIdKey='parentId',primaryKey='id',childrenKey='children'}=options
    const tree:any[]=[]
    const map:Map<number,any>=new Map()

    flat.forEach(item=>{
        map.set(item[primaryKey],{...item})
    })
    flat.forEach(item=>{
        if(hasParent(item)){
            const parent=map.get(item[parentIdKey])
            if(parent){
                if(!parent[childrenKey]){
                    parent[childrenKey]=[]
                }
                parent[childrenKey].push(item)
            }else{
                tree.push(item)
            }
        }else{
            tree.push(item)
        }
    })
    return tree
}
export const convertTreeToFlat=<T extends Record<string,any>>(tree:T[],childrenKey:string='children')=>{
    const flat:any[]=[]
    const queue:any[]=tree.slice()
    while(queue.length>0){
        const node=queue.shift()
        flat.push(node)
        if(node[childrenKey]){
            queue.push(...node[childrenKey])
        }
    }
    return flat
}
