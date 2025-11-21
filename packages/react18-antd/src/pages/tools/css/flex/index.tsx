
import {} from 'react'

export default function FlexLayout(){

    return <div className='p-6 w-full flex flex-col h-[100vh - 200px]'>
        <div className='flex justify-between'>
            <div className='flex-auto'>
            </div>
            <div className='flex-none'>
                <button className='border-1 rounded-sm cursor-pointer text-white px-3 py-1 bg-blue-500 hover:bg-blue-600'>添加项</button>
            </div>
        </div>
        <div className='flex'>
            <div className='flex-auto'>fdaa</div>
            <div className='flex-none'>aa</div>
        </div>
    </div>
}