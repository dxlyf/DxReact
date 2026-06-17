import { useOutlet } from "react-router-dom"

const AdminLayout=()=>{
    const outlet=useOutlet()
    return <div>
        admin layout
        {outlet}
    </div>
}

export default AdminLayout