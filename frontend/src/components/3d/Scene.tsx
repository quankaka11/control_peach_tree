import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';
import PeachBlossomTree from './PeachBlossomTree';

interface Gift {
  id: string;
  color: string;
  position: [number, number, number];
}

interface Card {
  id: string;
  position: [number, number, number];
}

interface SceneProps {
  gifts: Gift[];
  cards: Card[];
}

// Floating particles for atmosphere
const Particles = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 100;
  
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 1] = Math.random() * 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.001;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.03} 
        color="#ffd700" 
        transparent 
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
};

// Ground plane
const Ground = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <circleGeometry args={[3, 64]} />
      <meshStandardMaterial 
        color="#8b5e3c"
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
};

// Camera controller for smooth interactions
const CameraController = () => {
  const { camera } = useThree();
  
  useFrame(() => {
    camera.lookAt(0, 1.5, 0);
  });

  return null;
};

const Scene = ({ gifts, cards }: SceneProps) => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [3, 2, 4], fov: 50 }}
        shadows
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <pointLight position={[-3, 3, -3]} intensity={0.5} color="#ff9999" />
          <pointLight position={[3, 2, 3]} intensity={0.3} color="#ffd700" />
          
          {/* Environment */}
          <Stars radius={50} depth={50} count={500} factor={2} saturation={0} fade speed={0.5} />
          
          {/* Main tree */}
          <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.2}>
            <PeachBlossomTree gifts={gifts} cards={cards} />
          </Float>
          
          {/* Atmosphere */}
          <Particles />
          <Ground />
          
          {/* Controls */}
          <OrbitControls 
            enablePan={false}
            enableZoom={true}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2}
            minDistance={3}
            maxDistance={8}
            target={[0, 1.5, 0]}
            autoRotate
            autoRotateSpeed={0.3}
          />
          <CameraController />
          
          {/* Environment map for reflections */}
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene;
