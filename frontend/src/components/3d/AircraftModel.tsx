import React, { useRef, Suspense, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// 1. Load the model
function Model({ url }: { url: string }) {
 const { scene } = useGLTF(url);
 
 // Optional: Enhance the material to look more metallic/engineering-like
 React.useMemo(() => {
 scene.traverse((child) => {
 if ((child as THREE.Mesh).isMesh) {
 const mesh = child as THREE.Mesh;
 if (mesh.material instanceof THREE.MeshStandardMaterial) {
 mesh.material.metalness = 0.5;
 mesh.material.roughness = 0.3;
 mesh.material.envMapIntensity = 1.2;
 }
 }
 });
 }, [scene]);

 return <primitive object={scene} scale={0.8} position={[0, -1, 0]} />;
}

// 2. Camera Controller logic
export interface AircraftModelRef {
 resetView: () => void;
 setView: (view: 'front' | 'side' | 'top') => void;
}

const CameraController = forwardRef<AircraftModelRef>((props, ref) => {
 const controlsRef = useRef<any>(null);
 const { camera } = useThree();

 useImperativeHandle(ref, () => ({
 resetView: () => {
 if (controlsRef.current) {
 camera.position.set(10, 5, 10);
 controlsRef.current.target.set(0, 0, 0);
 controlsRef.current.update();
 }
 },
 setView: (view: 'front' | 'side' | 'top') => {
 if (controlsRef.current) {
 switch(view) {
 case 'front':
 camera.position.set(0, 0, 15);
 break;
 case 'side':
 camera.position.set(15, 0, 0);
 break;
 case 'top':
 camera.position.set(0, 15, 0);
 break;
 }
 controlsRef.current.target.set(0, 0, 0);
 controlsRef.current.update();
 }
 }
 }));

 return (
 <OrbitControls 
 ref={controlsRef} 
 enablePan={true}
 enableZoom={true}
 enableRotate={true}
 minDistance={3}
 maxDistance={25}
 maxPolarAngle={Math.PI / 1.5} // Prevent camera going completely underneath
 />
 );
});
CameraController.displayName = 'CameraController';


// 3. Main wrapper component
export function AircraftModel({ onCameraRef }: { onCameraRef?: (ref: AircraftModelRef) => void }) {
 const internalRef = useRef<AircraftModelRef>(null);

 React.useEffect(() => {
 if (onCameraRef && internalRef.current) {
 onCameraRef(internalRef.current);
 }
 }, [onCameraRef]);

 return (
 <div className="w-full h-full relative bg-[#F8FAFC]">
 <Canvas camera={{ position: [10, 5, 10], fov: 45 }} shadows>
 <Suspense fallback={null}>
 <color attach="background" args={['#F8FAFC']} />
 <ambientLight intensity={0.5} />
 <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
 <directionalLight position={[-10, 10, -5]} intensity={0.5} />
 
 <Model url="/airplane.glb" />
 
 <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={20} blur={2} far={4} />
 <hemisphereLight intensity={0.6} groundColor="#CBD5E1" />
 <CameraController ref={internalRef} />
 </Suspense>
 </Canvas>
 </div>
 );
}

// Preload to avoid mounting delay
useGLTF.preload('/airplane.glb');
