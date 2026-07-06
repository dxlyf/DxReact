type DirInfo = {
    name: string // 目录名
    type: 'dir'
    path:string
    dirpath:string
    children: (DirInfo | FileInfo)[]
}
type FileInfo = {
        dirpath:string
    path:string
    fileName: string // 文件名带扩展名
    ext: string // 文件扩展名
    name: string // 文件名不带扩展名
    type: 'file',
    component:any
}

const getDirTree = () => {
    const modules = import.meta.glob([
        '../views/**/*.vue',
        '!../views/**/_*.vue',
        '!../views/**/components/**/*.vue',
    ],{
        eager:false
    })

    // 分组
    const root: DirInfo = {
        name: '/',
        type: 'dir',
        path:'/',
        dirpath:'',
        children: []
    }

    for (let [modPath] of Object.entries(modules)) {
        let path = modPath.replace('../views/', '')
        const parts = path.split('/')
        let current = root
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i]
            if (i === parts.length - 1) {
                // 文件
                const dirPath=parts.slice(0,-1).join('/')
                const dotIndex = part.lastIndexOf('.')
                const name = dotIndex > 0 ? part.substring(0, dotIndex) : part
                const ext = dotIndex > 0 ? part.substring(dotIndex) : ''
                 
                current.children.push({
                    fileName: part,
                    ext,
                    name,
                    dirpath:parts.length>1?'/'+parts.slice(0,i).join('/'):'/',
                    path:parts.length>1?'/'+parts.slice(0,-1).join('/')+'/'+name.toLowerCase():'/'+name.toLowerCase(),
                    type: 'file',
                    component:modules[modPath]
                })
            } else {
                // 目录
                let dir = current.children.find(child => child.type === 'dir' && child.name === part) as DirInfo | undefined
                if (!dir) {
      
                    dir = {
                        name: part,
                        type: 'dir',
                        dirpath:i>0?'/'+parts.slice(0,i).join('/'):'/',
                        path:i>0?'/'+parts.slice(0,i).join('/')+'/'+part:'/'+part,
                        children: []
                    }
                    current.children.push(dir)
                }
                current = dir
            }
        }
    }

    return root
}


export {
    getDirTree
}