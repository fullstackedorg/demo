import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

type Background3DProps = {
    theme: string;
    count: number;
};

function Starfield({ theme, count }: Background3DProps) {
    const ref = useRef<THREE.Points>(null);
    const materialRef = useRef<any>(null);
    const [originalPositions] = useState(() => {
        const positions = new Float32Array(3000 * 3);
        const radius = 1.5;
        for (let i = 0; i < 3000; i++) {
            const r = radius * Math.cbrt(Math.random());
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }
        return positions;
    });

    // We need a mutable copy to apply the repulsion effect
    const [sphere] = useState(() => new Float32Array(originalPositions));

    // Track velocities for the spring effect back to original positions
    const velocities = useRef(new Float32Array(3000 * 3));

    const pointer = useRef(new THREE.Vector2(0, 0));
    const targetScale = useRef(1);
    const isInteracting = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                pointer.current.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
                pointer.current.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
            }
        };

        const handleInteractionStart = () => {
            targetScale.current = 1.05; // Quick bump in scale
            isInteracting.current = true;
        };

        const handleInteractionEnd = () => {
            targetScale.current = 1.0;
            isInteracting.current = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: true });

        // Use mousedown/touchstart for continuous repulsion while held
        window.addEventListener('mousedown', handleInteractionStart);
        window.addEventListener('touchstart', handleInteractionStart, { passive: true });
        window.addEventListener('mouseup', handleInteractionEnd);
        window.addEventListener('touchend', handleInteractionEnd);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('mousedown', handleInteractionStart);
            window.removeEventListener('touchstart', handleInteractionStart);
            window.removeEventListener('mouseup', handleInteractionEnd);
            window.removeEventListener('touchend', handleInteractionEnd);
        };
    }, []);

    const raycaster = new THREE.Raycaster();
    const targetColor = useRef(new THREE.Color(theme === 'dark' ? '#38bdf8' : '#0ea5e9'));

    useEffect(() => {
        const baseHue = 195; // Approximate hue of sky-500
        const hueShift = (baseHue + count * 45) % 360;
        // Light mode: make particles darker (lightness 0.15) so they contrast with slate-50 background a lot better
        // Dark mode: keep them relatively bright (lightness 0.55)
        targetColor.current.setHSL(hueShift / 360, theme === 'dark' ? 0.9 : 0.8, theme === 'dark' ? 0.55 : 0.15);
    }, [count, theme]);

    useFrame((state, delta) => {
        if (!ref.current) return;

        // Default subtle floating animation
        ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;

        // Base passive rotation
        ref.current.rotation.x -= delta / 20;
        ref.current.rotation.y -= delta / 30;

        // Interactive parallax effect based on pointer
        const targetX = (pointer.current.y * Math.PI) / 6;
        const targetY = (pointer.current.x * Math.PI) / 6;

        ref.current.rotation.x += 0.05 * (targetX - ref.current.rotation.x);
        ref.current.rotation.y += 0.05 * (targetY - ref.current.rotation.y);

        // Scale interaction effect
        ref.current.scale.lerp(new THREE.Vector3(targetScale.current, targetScale.current, targetScale.current), 0.1);

        // Particle repulsion physics
        const positions = ref.current.geometry.attributes.position.array as Float32Array;

        // Raycast to find pointer plane intersection
        raycaster.setFromCamera(pointer.current, state.camera);
        // Intersect with a plane at z=0 to get world coordinates of cursor
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const targetPosition = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, targetPosition);

        // Convert world to local space
        ref.current.worldToLocal(targetPosition);

        const repulsionRadius = 0.8;
        const repulsionForce = 2.0;
        const springRestitution = 0.1;
        const damping = 0.9;

        for (let i = 0; i < 3000; i++) {
            const ix = i * 3;
            const iy = i * 3 + 1;
            const iz = i * 3 + 2;

            const x = positions[ix];
            const y = positions[iy];
            const z = positions[iz];

            // Original target position
            const ox = originalPositions[ix];
            const oy = originalPositions[iy];
            const oz = originalPositions[iz];

            // Spring force towards original position
            velocities.current[ix] += (ox - x) * springRestitution;
            velocities.current[iy] += (oy - y) * springRestitution;
            velocities.current[iz] += (oz - z) * springRestitution;

            // Interaction repulsion force
            if (isInteracting.current && targetPosition) {
                const dx = x - targetPosition.x;
                const dy = y - targetPosition.y;
                const dz = z - targetPosition.z;

                const distanceSq = dx * dx + dy * dy + dz * dz;

                if (distanceSq < repulsionRadius * repulsionRadius) {
                    const distance = Math.sqrt(distanceSq);
                    const force = (repulsionRadius - distance) / repulsionRadius * repulsionForce;

                    // Add velocity pushing away from cursor
                    velocities.current[ix] += (dx / distance) * force * delta;
                    velocities.current[iy] += (dy / distance) * force * delta;
                    velocities.current[iz] += (dz / distance) * force * delta;
                }
            }

            // Apply damping layer
            velocities.current[ix] *= damping;
            velocities.current[iy] *= damping;
            velocities.current[iz] *= damping;

            // Update positions based on velocity
            positions[ix] += velocities.current[ix];
            positions[iy] += velocities.current[iy];
            positions[iz] += velocities.current[iz];
        }

        ref.current.geometry.attributes.position.needsUpdate = true;

        if (materialRef.current) {
            materialRef.current.color.lerp(targetColor.current, 0.05);
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
                <PointMaterial
                    ref={materialRef}
                    transparent
                    size={0.015}
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={theme === 'dark' ? 0.25 : 1.0}
                />
            </Points>
        </group>
    );
}

export default function Background3D({ theme, count }: Background3DProps) {
    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
            <Canvas
                camera={{ position: [0, 0, 2], fov: 60 }}
                gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
                dpr={[1, 1.5]}
            >
                <Starfield theme={theme} count={count} />
            </Canvas>
        </div>
    );
}
