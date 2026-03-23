import { observer } from 'mobx-react-lite';

export const Light = observer(() => {
  return (
    <>
      <ambientLight intensity={1.51} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
    </>
  );
});
