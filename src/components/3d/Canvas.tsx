import { Box } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { CamControls } from "./scene/CamControls"
export const Canvas3d = ()=>{
    return (
        <Canvas  onCreated={(state) => state.gl.setClearColor("#0d0b0e")}>
            <Box/>
            <CamControls />
        </Canvas>
    )
}