export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={1.35} color="#f2dfb6" />
      <directionalLight position={[-3.5, 4.8, 5.5]} intensity={2.2} color="#ffe2a5" castShadow />
      <directionalLight position={[4, -2, 3]} intensity={0.55} color="#8e6b42" />
    </>
  );
}
