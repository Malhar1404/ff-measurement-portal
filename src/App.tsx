import './App.css'
import { Canvas3d } from './components/3d/Canvas'
import { Sidebar } from './components/ui/side-bar/Sidebar'

function App() {

  return (
    <>
     <div className='h-screen w-screen flex'>
        <Sidebar />
        <Canvas3d />
     </div>
    </>
  )
}

export default App
