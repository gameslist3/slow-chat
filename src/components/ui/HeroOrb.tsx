import React, { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

const Orb = () => {
    const mesh = useRef<THREE.Mesh>(null!);
    const [hovered, setHover] = useState(false);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        mesh.current.rotation.x = Math.cos(t / 4) / 2;
        mesh.current.rotation.y = Math.sin(t / 4) / 2;
        mesh.current.rotation.z = Math.sin(t / 4) / 2;

        // Subtle float based on mouse
        if (!hovered) {
            mesh.current.position.y = Math.sin(t / 2) / 10;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <Sphere
                ref={mesh}
                args={[1, 64, 64]}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
                scale={hovered ? 1.1 : 1}
            >
                <MeshDistortMaterial
                    color="#5B7DCB"
                    speed={hovered ? 4 : 2}
                    distort={0.4}
                    radius={1}
                    metalness={0.8}
                    roughness={0.2}
                />
            </Sphere>
        </Float>
    );
};

export const HeroOrb: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={`w-full h-full min-h-[200px] ${className}`}>
            <Suspense fallback={null}>
                <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                    <pointLight position={[-10, -10, -10]} />
                    <Orb />
                </Canvas>
            </Suspense>
        </div>
    );
};
