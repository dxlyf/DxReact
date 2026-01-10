import React, {createContext} from 'react'

type ProPageContexType = {

}
const ProPageContex = createContext<ProPageContexType>(null)


const ProPageProvider:React.FC<React.PropsWithChildren<{}>> = ({children}) => {

    return <ProPageContex.Provider value={{}}>{children}</ProPageContex.Provider>
}

