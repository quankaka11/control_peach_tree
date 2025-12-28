import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BlossomProps {
  position: [number, number, number];
  scale?: number;
  delay?: number;
}

// Realistic 5-petal blossom flower
const Blossom = ({ position, scale = 1, delay = 0 }: BlossomProps) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + delay) * 0.05;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.3 + delay) * 0.01;
    }
  });

  const petalShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.03, 0.04, 0, 0.08);
    shape.quadraticCurveTo(-0.03, 0.04, 0, 0);
    return shape;
  }, []);

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* 5 Petals */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh 
          key={i} 
          rotation={[0, 0, (i * Math.PI * 2) / 5]}
          position={[0, 0, 0]}
        >
          <shapeGeometry args={[petalShape]} />
          <meshStandardMaterial 
            color="#ffb6c1"
            emissive="#ff69b4"
            emissiveIntensity={0.15}
            roughness={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {/* Center */}
      <mesh position={[0, 0, 0.005]}>
        <circleGeometry args={[0.015, 12]} />
        <meshStandardMaterial color="#ffeb3b" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
      {/* Stamens */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh 
          key={`stamen-${i}`}
          position={[
            Math.cos((i * Math.PI * 2) / 6) * 0.012,
            Math.sin((i * Math.PI * 2) / 6) * 0.012,
            0.008
          ]}
        >
          <sphereGeometry args={[0.004, 6, 6]} />
          <meshStandardMaterial color="#ff6b35" />
        </mesh>
      ))}
    </group>
  );
};

// Small green leaf
const Leaf = ({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) => {
  const leafShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.02, 0.03, 0, 0.06);
    shape.quadraticCurveTo(-0.02, 0.03, 0, 0);
    return shape;
  }, []);

  return (
    <mesh position={position} rotation={rotation}>
      <shapeGeometry args={[leafShape]} />
      <meshStandardMaterial 
        color="#4ade80"
        emissive="#22c55e"
        emissiveIntensity={0.1}
        roughness={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

interface BranchProps {
  points: THREE.Vector3[];
  thickness?: number;
  taper?: number;
}

// Curved branch using CatmullRom curve for smooth bends
const Branch = ({ points, thickness = 0.03, taper = 0.6 }: BranchProps) => {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeSegments = 32;
    const radialSegments = 8;
    
    // Create tapered tube
    const path = curve.getPoints(tubeSegments);
    const frames = curve.computeFrenetFrames(tubeSegments);
    
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    
    for (let i = 0; i <= tubeSegments; i++) {
      const t = i / tubeSegments;
      const radius = thickness * (1 - t * (1 - taper));
      
      for (let j = 0; j <= radialSegments; j++) {
        const angle = (j / radialSegments) * Math.PI * 2;
        
        const normal = new THREE.Vector3();
        normal.x = Math.cos(angle);
        normal.y = Math.sin(angle);
        normal.z = 0;
        
        normal.applyMatrix4(
          new THREE.Matrix4().makeBasis(
            frames.normals[i],
            frames.binormals[i],
            frames.tangents[i]
          )
        );
        
        const vertex = new THREE.Vector3();
        vertex.copy(path[i]);
        vertex.addScaledVector(normal, radius);
        
        vertices.push(vertex.x, vertex.y, vertex.z);
        uvs.push(j / radialSegments, t);
      }
    }
    
    for (let i = 0; i < tubeSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * (radialSegments + 1) + j;
        const b = (i + 1) * (radialSegments + 1) + j;
        const c = (i + 1) * (radialSegments + 1) + (j + 1);
        const d = i * (radialSegments + 1) + (j + 1);
        
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    
    return geo;
  }, [points, thickness, taper]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial 
        color="#5d4037"
        roughness={0.9}
        metalness={0.05}
      />
    </mesh>
  );
};

interface GiftBoxProps {
  position: [number, number, number];
  color: string;
  id: string;
  onClick?: (id: string, color: string) => void;
}

export const GiftBox3D = ({ position, color, id, onClick }: GiftBoxProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.03;
      // Scale up on hover
      const targetScale = hovered ? 1.15 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    onClick?.(id, color);
  };

  return (
    <group 
      ref={meshRef} 
      position={position}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* String */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.3]} />
        <meshStandardMaterial color="#c4a35a" />
      </mesh>
      {/* Box */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.15, 0.12, 0.15]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.3} 
          metalness={0.1}
          emissive={hovered ? color : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      {/* Ribbon horizontal */}
      <mesh position={[0, 0.061, 0]}>
        <boxGeometry args={[0.16, 0.02, 0.04]} />
        <meshStandardMaterial color="#c4a35a" metalness={0.3} />
      </mesh>
      {/* Ribbon vertical */}
      <mesh position={[0, 0.061, 0]}>
        <boxGeometry args={[0.04, 0.02, 0.16]} />
        <meshStandardMaterial color="#c4a35a" metalness={0.3} />
      </mesh>
      {/* Bow */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#c4a35a" metalness={0.4} />
      </mesh>
    </group>
  );
};

interface GreetingCard3DProps {
  position: [number, number, number];
  id: string;
  onClick?: (id: string) => void;
}

export const GreetingCard3D = ({ position, id, onClick }: GreetingCard3DProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
      // Scale up on hover
      const targetScale = hovered ? 1.15 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    onClick?.(id);
  };

  return (
    <group 
      ref={meshRef} 
      position={position}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* String */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.24]} />
        <meshStandardMaterial color="#b91c1c" />
      </mesh>
      {/* Card */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.12, 0.16, 0.01]} />
        <meshStandardMaterial 
          color="#dc2626" 
          roughness={0.5}
          emissive={hovered ? '#dc2626' : '#000000'}
          emissiveIntensity={hovered ? 0.4 : 0}
        />
      </mesh>
      {/* Gold border */}
      <mesh position={[0, 0, 0.006]}>
        <boxGeometry args={[0.1, 0.14, 0.002]} />
        <meshStandardMaterial color="#c4a35a" metalness={0.5} />
      </mesh>
      {/* Gold character */}
      <mesh position={[0, 0, 0.008]}>
        <boxGeometry args={[0.05, 0.05, 0.002]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.6} />
      </mesh>
    </group>
  );
};

// Wooden pot/stand
const WoodenPot = () => {
  return (
    <group position={[0, -0.3, 0]}>
      {/* Main pot */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.25, 0.25, 8]} />
        <meshStandardMaterial color="#5d4037" roughness={0.8} />
      </mesh>
      {/* Pot rim */}
      <mesh position={[0, 0.12, 0]}>
        <torusGeometry args={[0.36, 0.03, 8, 8]} />
        <meshStandardMaterial color="#4e342e" roughness={0.7} />
      </mesh>
      {/* Pot base */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.08, 8]} />
        <meshStandardMaterial color="#3e2723" roughness={0.8} />
      </mesh>
      {/* Decorative ring */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.015, 8, 32]} />
        <meshStandardMaterial color="#8d6e63" roughness={0.6} metalness={0.1} />
      </mesh>
    </group>
  );
};

interface PeachBlossomTreeProps {
  gifts: Array<{ id: string; color: string; position: [number, number, number] }>;
  cards: Array<{ id: string; position: [number, number, number] }>;
  onGiftClick?: (id: string, color: string) => void;
  onCardClick?: (id: string) => void;
}

const PeachBlossomTree = ({ gifts, cards, onGiftClick, onCardClick }: PeachBlossomTreeProps) => {
  const groupRef = useRef<THREE.Group>(null);

  // S-shaped trunk like bonsai style
  const trunkPoints = useMemo(() => [
    new THREE.Vector3(0, -0.1, 0),
    new THREE.Vector3(0.1, 0.3, 0.05),
    new THREE.Vector3(-0.1, 0.6, 0),
    new THREE.Vector3(0.15, 0.9, 0.05),
    new THREE.Vector3(0, 1.2, 0),
  ], []);

  // Main branch curves
  const mainBranches = useMemo(() => [
    // Right main branch
    [
      new THREE.Vector3(0, 1.0, 0),
      new THREE.Vector3(0.3, 1.3, 0.1),
      new THREE.Vector3(0.7, 1.5, 0.15),
      new THREE.Vector3(1.1, 1.6, 0.1),
    ],
    // Left main branch
    [
      new THREE.Vector3(0, 1.1, 0),
      new THREE.Vector3(-0.25, 1.4, -0.1),
      new THREE.Vector3(-0.6, 1.7, -0.05),
      new THREE.Vector3(-0.95, 1.85, 0),
    ],
    // Top main branch
    [
      new THREE.Vector3(0, 1.2, 0),
      new THREE.Vector3(0.1, 1.6, 0.05),
      new THREE.Vector3(0.05, 2.0, 0),
      new THREE.Vector3(0, 2.4, 0),
    ],
    // Front right
    [
      new THREE.Vector3(0.7, 1.5, 0.15),
      new THREE.Vector3(0.9, 1.3, 0.35),
      new THREE.Vector3(1.15, 1.2, 0.45),
    ],
    // Back left
    [
      new THREE.Vector3(-0.6, 1.7, -0.05),
      new THREE.Vector3(-0.75, 2.0, -0.25),
      new THREE.Vector3(-0.85, 2.25, -0.35),
    ],
  ].map(pts => pts.map(p => new THREE.Vector3(p.x, p.y, p.z))), []);

  // Secondary branches
  const secondaryBranches = useMemo(() => [
    // From right branch
    [[1.1, 1.6, 0.1], [1.3, 1.4, 0.2], [1.5, 1.25, 0.15]],
    [[1.1, 1.6, 0.1], [1.25, 1.75, 0], [1.35, 1.9, -0.1]],
    [[0.7, 1.5, 0.15], [0.85, 1.7, 0.25], [0.95, 1.9, 0.3]],
    // From left branch
    [[-0.95, 1.85, 0], [-1.1, 1.7, 0.15], [-1.25, 1.55, 0.1]],
    [[-0.95, 1.85, 0], [-1.05, 2.05, 0.1], [-1.15, 2.2, 0.05]],
    [[-0.6, 1.7, -0.05], [-0.7, 1.55, 0.1], [-0.85, 1.4, 0.15]],
    // From top branch
    [[0.05, 2.0, 0], [0.25, 2.15, 0.1], [0.45, 2.25, 0.15]],
    [[0.05, 2.0, 0], [-0.2, 2.2, -0.1], [-0.4, 2.35, -0.15]],
    [[0, 2.4, 0], [0.15, 2.55, 0.1], [0.25, 2.7, 0.05]],
    [[0, 2.4, 0], [-0.15, 2.6, -0.05], [-0.25, 2.75, 0]],
    // Extra branches
    [[0.3, 1.3, 0.1], [0.5, 1.15, 0.25], [0.7, 1.0, 0.35]],
    [[-0.25, 1.4, -0.1], [-0.45, 1.25, -0.2], [-0.65, 1.1, -0.15]],
    [[0.1, 1.6, 0.05], [0.35, 1.75, -0.1], [0.55, 1.85, -0.2]],
  ].map(pts => pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))), []);

  // Tertiary branches (smaller)
  const tertiaryBranches = useMemo(() => [
    [[1.5, 1.25, 0.15], [1.6, 1.15, 0.25], [1.7, 1.05, 0.3]],
    [[1.35, 1.9, -0.1], [1.45, 2.0, -0.05], [1.55, 2.1, 0]],
    [[-1.25, 1.55, 0.1], [-1.35, 1.45, 0.2], [-1.45, 1.35, 0.25]],
    [[-1.15, 2.2, 0.05], [-1.25, 2.3, 0.15], [-1.3, 2.4, 0.2]],
    [[0.45, 2.25, 0.15], [0.55, 2.35, 0.2], [0.6, 2.45, 0.25]],
    [[-0.4, 2.35, -0.15], [-0.5, 2.45, -0.2], [-0.55, 2.55, -0.25]],
    [[0.25, 2.7, 0.05], [0.3, 2.8, 0.1], [0.32, 2.9, 0.08]],
    [[-0.25, 2.75, 0], [-0.3, 2.85, 0.05], [-0.28, 2.95, 0.02]],
    [[0.95, 1.9, 0.3], [1.05, 2.0, 0.35], [1.1, 2.1, 0.4]],
    [[-0.85, 2.25, -0.35], [-0.95, 2.35, -0.4], [-1.0, 2.45, -0.45]],
    [[0.7, 1.0, 0.35], [0.8, 0.9, 0.4], [0.9, 0.85, 0.45]],
    [[-0.65, 1.1, -0.15], [-0.75, 1.0, -0.2], [-0.85, 0.95, -0.25]],
  ].map(pts => pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))), []);

  // Generate many blossoms along all branches
  const blossoms = useMemo(() => {
    const positions: Array<{ position: [number, number, number]; scale: number; delay: number; rotation: [number, number, number] }> = [];
    
    // Branch end points for dense clustering
    const branchEnds = [
      [1.7, 1.05, 0.3], [1.55, 2.1, 0], [1.1, 2.1, 0.4],
      [-1.45, 1.35, 0.25], [-1.3, 2.4, 0.2], [-1.0, 2.45, -0.45],
      [0.6, 2.45, 0.25], [-0.55, 2.55, -0.25],
      [0.32, 2.9, 0.08], [-0.28, 2.95, 0.02],
      [0.9, 0.85, 0.45], [-0.85, 0.95, -0.25],
      [1.5, 1.25, 0.15], [-1.25, 1.55, 0.1],
      [0.95, 1.9, 0.3], [-0.85, 2.25, -0.35],
      [0.55, 1.85, -0.2], [-0.7, 1.55, 0.1],
    ];

    // Dense blossoms at branch ends
    branchEnds.forEach((end, i) => {
      const numBlossoms = 8 + Math.floor(Math.random() * 6);
      for (let j = 0; j < numBlossoms; j++) {
        positions.push({
          position: [
            end[0] + (Math.random() - 0.5) * 0.25,
            end[1] + (Math.random() - 0.5) * 0.2,
            end[2] + (Math.random() - 0.5) * 0.25,
          ] as [number, number, number],
          scale: 0.7 + Math.random() * 0.5,
          delay: i * 0.3 + j * 0.15,
          rotation: [
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * Math.PI * 2,
            (Math.random() - 0.5) * 0.8,
          ] as [number, number, number],
        });
      }
    });

    // Mid-branch blossoms
    const midPoints = [
      [1.1, 1.6, 0.1], [-0.95, 1.85, 0], [0.05, 2.0, 0], [0, 2.4, 0],
      [0.7, 1.5, 0.15], [-0.6, 1.7, -0.05], [0.45, 2.25, 0.15], [-0.4, 2.35, -0.15],
      [0.3, 1.3, 0.1], [-0.25, 1.4, -0.1], [0.1, 1.6, 0.05],
    ];

    midPoints.forEach((mid, i) => {
      const numBlossoms = 5 + Math.floor(Math.random() * 4);
      for (let j = 0; j < numBlossoms; j++) {
        positions.push({
          position: [
            mid[0] + (Math.random() - 0.5) * 0.2,
            mid[1] + (Math.random() - 0.5) * 0.15,
            mid[2] + (Math.random() - 0.5) * 0.2,
          ] as [number, number, number],
          scale: 0.6 + Math.random() * 0.4,
          delay: i * 0.2 + j * 0.1,
          rotation: [
            (Math.random() - 0.5) * 0.6,
            Math.random() * Math.PI * 2,
            (Math.random() - 0.5) * 0.6,
          ] as [number, number, number],
        });
      }
    });

    return positions;
  }, []);

  // Generate leaves
  const leaves = useMemo(() => {
    const leafPositions: Array<{ position: [number, number, number]; rotation: [number, number, number] }> = [];
    
    const leafPoints = [
      [1.6, 1.1, 0.28], [1.5, 2.05, -0.05], [1.05, 2.05, 0.38],
      [-1.4, 1.4, 0.22], [-1.25, 2.35, 0.18], [-0.95, 2.4, -0.42],
      [0.55, 2.4, 0.22], [-0.5, 2.5, -0.22], [0.28, 2.85, 0.08],
      [-0.25, 2.9, 0.03], [0.85, 0.88, 0.42], [-0.8, 0.98, -0.22],
      [1.45, 1.2, 0.18], [-1.2, 1.5, 0.12], [0.9, 1.85, 0.32],
      [-0.8, 2.2, -0.32], [0.5, 1.8, -0.18], [-0.65, 1.5, 0.12],
    ];

    leafPoints.forEach((point) => {
      const numLeaves = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numLeaves; i++) {
        leafPositions.push({
          position: [
            point[0] + (Math.random() - 0.5) * 0.1,
            point[1] + (Math.random() - 0.5) * 0.08,
            point[2] + (Math.random() - 0.5) * 0.1,
          ] as [number, number, number],
          rotation: [
            Math.random() * 0.5,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI - Math.PI / 2,
          ] as [number, number, number],
        });
      }
    });

    return leafPositions;
  }, []);

  return (
    <group ref={groupRef}>
      {/* Wooden pot */}
      <WoodenPot />

      {/* Main trunk - S curve */}
      <Branch points={trunkPoints} thickness={0.1} taper={0.45} />
      
      {/* Main branches */}
      {mainBranches.map((pts, i) => (
        <Branch 
          key={`main-${i}`} 
          points={pts} 
          thickness={0.045} 
          taper={0.35}
        />
      ))}
      
      {/* Secondary branches */}
      {secondaryBranches.map((pts, i) => (
        <Branch 
          key={`secondary-${i}`} 
          points={pts} 
          thickness={0.025}
          taper={0.4}
        />
      ))}

      {/* Tertiary branches */}
      {tertiaryBranches.map((pts, i) => (
        <Branch 
          key={`tertiary-${i}`} 
          points={pts} 
          thickness={0.012}
          taper={0.5}
        />
      ))}
      
      {/* Blossoms */}
      {blossoms.map((blossom, i) => (
        <group key={i} rotation={blossom.rotation}>
          <Blossom 
            position={blossom.position} 
            scale={blossom.scale}
            delay={blossom.delay}
          />
        </group>
      ))}

      {/* Leaves */}
      {leaves.map((leaf, i) => (
        <Leaf 
          key={`leaf-${i}`}
          position={leaf.position}
          rotation={leaf.rotation}
        />
      ))}

      {/* Gift boxes */}
      {gifts.map((gift) => (
        <GiftBox3D 
          key={gift.id} 
          id={gift.id}
          position={gift.position} 
          color={gift.color}
          onClick={onGiftClick}
        />
      ))}

      {/* Greeting cards */}
      {cards.map((card) => (
        <GreetingCard3D 
          key={card.id} 
          id={card.id}
          position={card.position}
          onClick={onCardClick}
        />
      ))}
    </group>
  );
};

export default PeachBlossomTree;
