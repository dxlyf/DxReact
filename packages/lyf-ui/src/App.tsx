import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Popover from '@/components/popup/Popover'

import Button from '@/components/general/Button'

function App() {

  return (
    <>
      <Popover content={<div>这是一个弹出层</div>}>
        <button>点击我</button>
      </Popover>
      <Button type='primary'>点击我</Button>
    </>
  )
}

export default App
