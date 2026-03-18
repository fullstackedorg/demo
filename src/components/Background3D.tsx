import React, { useRef, useEffect } from "react";
import * as THREE from "three";

type Background3DProps = {
    theme: string;
    count: number;
};

const PARTICLE_COUNT = 3000;

export default function Background3D({ theme, count }: Background3DProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Keep theme/count accessible inside the render loop without restarting it
    const themeRef = useRef(theme);
    const countRef = useRef(count);
    useEffect(() => { themeRef.current = theme; }, [theme]);
    useEffect(() => { countRef.current = count; }, [count]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // ── Renderer ────────────────────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: false,
            powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
        renderer.setClearColor(0x000000, 0);

        // ── Scene & Camera ───────────────────────────────────────────────────
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            60,
            canvas.clientWidth / canvas.clientHeight,
            0.1,
            100
        );
        camera.position.set(0, 0, 2);

        // ── Particles ────────────────────────────────────────────────────────
        const originalPositions = new Float32Array(PARTICLE_COUNT * 3);
        {
            const radius = 1.5;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const r = radius * Math.cbrt(Math.random());
                const theta = Math.random() * 2 * Math.PI;
                const phi = Math.acos(2 * Math.random() - 1);
                originalPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
                originalPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                originalPositions[i * 3 + 2] = r * Math.cos(phi);
            }
        }

        const positions  = new Float32Array(originalPositions);
        const velocities = new Float32Array(PARTICLE_COUNT * 3);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

        // Circular disc sprite so particles render as round dots
        const discCanvas = document.createElement("canvas");
        discCanvas.width = discCanvas.height = 64;
        const ctx = discCanvas.getContext("2d")!;
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, "rgba(255,255,255,1)");
        grad.addColorStop(0.5, "rgba(255,255,255,0.8)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
        const discTexture = new THREE.CanvasTexture(discCanvas);

        const initialColor = new THREE.Color(
            themeRef.current === "dark" ? "#48bcff" : "#003d96"
        );
        const material = new THREE.PointsMaterial({
            color: initialColor,
            map: discTexture,
            size: 0.02,
            sizeAttenuation: true,
            transparent: true,
            depthWrite: false,
            opacity: themeRef.current === "dark" ? 0.25 : 1.0,
            alphaTest: 0.001,
        });

        // Group mirrors the r3f <group rotation={[0,0,Math.PI/4]}>
        const group = new THREE.Group();
        group.rotation.z = Math.PI / 4;
        const points = new THREE.Points(geometry, material);
        group.add(points);
        scene.add(group);

        // ── Interaction state ────────────────────────────────────────────────
        const pointer       = new THREE.Vector2(0, 0);
        let   targetScale   = 1;
        let   isInteracting = false;
        let   elapsed       = 0;
        const targetColor   = initialColor.clone();

        // ── Event listeners ──────────────────────────────────────────────────
        const onMouseMove = (e: MouseEvent) => {
            pointer.x =  (e.clientX / window.innerWidth)  * 2 - 1;
            pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                pointer.x =  (e.touches[0].clientX / window.innerWidth)  * 2 - 1;
                pointer.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
            }
        };
        const onInteractionStart = () => { targetScale = 1.05; isInteracting = true; };
        const onInteractionEnd   = () => { targetScale = 1.0;  isInteracting = false; };

        window.addEventListener("mousemove",  onMouseMove);
        window.addEventListener("touchmove",  onTouchMove,  { passive: true });
        window.addEventListener("mousedown",  onInteractionStart);
        window.addEventListener("touchstart", onInteractionStart, { passive: true });
        window.addEventListener("mouseup",    onInteractionEnd);
        window.addEventListener("touchend",   onInteractionEnd);

        // ── Resize handling ──────────────────────────────────────────────────
        const onResize = () => {
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
        };
        const resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(canvas);

        // ── Render loop ──────────────────────────────────────────────────────
        const raycaster  = new THREE.Raycaster();
        const plane      = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const worldCursor = new THREE.Vector3();
        const scaleVec   = new THREE.Vector3();

        let lastTime = performance.now();
        let rafId: number;

        const repulsionRadius  = 0.8;
        const repulsionForce   = 2.0;
        const springRestitution = 0.1;
        const damping          = 0.9;

        function animate() {
            rafId = requestAnimationFrame(animate);

            const now   = performance.now();
            const delta = Math.min((now - lastTime) / 1000, 0.1); // seconds, capped
            lastTime    = now;
            elapsed    += delta;

            // Update target color from current props
            {
                const isDark  = themeRef.current === "dark";
                const baseHue = 202;
                const hueShift = (baseHue + countRef.current * 45) % 360;
                targetColor.setHSL(
                    hueShift / 360,
                    isDark ? 0.9 : 0.8,
                    isDark ? 0.55 : 0.40
                );
                material.opacity = isDark ? 0.25 : 1.0;
            }

            // Lerp material color toward target
            material.color.lerp(targetColor, 0.05);

            // Floating Y animation
            points.position.y = Math.sin(elapsed * 0.5) * 0.1;

            // Base passive rotation
            points.rotation.x -= delta / 20;
            points.rotation.y -= delta / 30;

            // Parallax rotation toward pointer
            const targetRotX = (pointer.y * Math.PI) / 6;
            const targetRotY = (pointer.x * Math.PI) / 6;
            points.rotation.x += 0.05 * (targetRotX - points.rotation.x);
            points.rotation.y += 0.05 * (targetRotY - points.rotation.y);

            // Scale lerp
            const cs = points.scale.x;
            const ns = cs + 0.1 * (targetScale - cs);
            points.scale.set(ns, ns, ns);

            // Raycast cursor into world space (plane at z=0)
            raycaster.setFromCamera(pointer, camera);
            raycaster.ray.intersectPlane(plane, worldCursor);

            // Transform cursor into points local space for repulsion
            scaleVec.copy(worldCursor);
            points.worldToLocal(scaleVec);
            const lcx = scaleVec.x;
            const lcy = scaleVec.y;
            const lcz = scaleVec.z;

            const posAttr = geometry.attributes.position;
            const pos     = posAttr.array as Float32Array;

            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const ix = i * 3, iy = ix + 1, iz = ix + 2;

                const x = pos[ix], y = pos[iy], z = pos[iz];
                const ox = originalPositions[ix];
                const oy = originalPositions[iy];
                const oz = originalPositions[iz];

                // Spring toward original position
                velocities[ix] += (ox - x) * springRestitution;
                velocities[iy] += (oy - y) * springRestitution;
                velocities[iz] += (oz - z) * springRestitution;

                // Repulsion from cursor
                if (isInteracting) {
                    const dx = x - lcx;
                    const dy = y - lcy;
                    const dz = z - lcz;
                    const distSq = dx * dx + dy * dy + dz * dz;
                    if (distSq < repulsionRadius * repulsionRadius) {
                        const dist  = Math.sqrt(distSq);
                        const force = ((repulsionRadius - dist) / repulsionRadius) * repulsionForce;
                        velocities[ix] += (dx / dist) * force * delta;
                        velocities[iy] += (dy / dist) * force * delta;
                        velocities[iz] += (dz / dist) * force * delta;
                    }
                }

                // Damping
                velocities[ix] *= damping;
                velocities[iy] *= damping;
                velocities[iz] *= damping;

                // Integrate
                pos[ix] += velocities[ix];
                pos[iy] += velocities[iy];
                pos[iz] += velocities[iz];
            }

            posAttr.needsUpdate = true;

            renderer.render(scene, camera);
        }

        animate();

        // ── Cleanup ──────────────────────────────────────────────────────────
        return () => {
            cancelAnimationFrame(rafId);
            resizeObserver.disconnect();
            window.removeEventListener("mousemove",  onMouseMove);
            window.removeEventListener("touchmove",  onTouchMove);
            window.removeEventListener("mousedown",  onInteractionStart);
            window.removeEventListener("touchstart", onInteractionStart);
            window.removeEventListener("mouseup",    onInteractionEnd);
            window.removeEventListener("touchend",   onInteractionEnd);
            geometry.dispose();
            material.dispose();
            discTexture.dispose();
            renderer.dispose();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    // ↑ intentionally empty — theme/count are read via refs so the loop never restarts

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", display: "block" }}
            />
        </div>
    );
}
