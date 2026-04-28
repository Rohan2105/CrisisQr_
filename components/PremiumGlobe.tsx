'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

function RotatingGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <Sphere ref={meshRef} args={[2.2, 64, 64]} rotation={[0.4, 0, 0]}>
      <meshStandardMaterial 
        color="#1c1c1c" 
        wireframe 
        transparent
        opacity={0.8}
        wireframeLinewidth={0.5}
      />
    </Sphere>
  );
}

export default function PremiumGlobe() {
  return (
    <div className="w-full h-full bg-white flex items-center justify-center">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <RotatingGlobe />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}
