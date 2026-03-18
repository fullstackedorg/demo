import React, { useRef, useEffect } from "react";
import * as THREE from "three";

type Background3DProps = {
    theme: string;
    count: number;
};

const PARTICLE_COUNT = 3000;

// ── Vertex shader ─────────────────────────────────────────────────────────────
// Runs once per particle entirely on the GPU.
// Receives the static original position as an attribute, applies:
//   • floating Y animation
//   • smooth radial repulsion field from the cursor (when interacting)
// No per-particle CPU work; the "spring return" is implicit — the base position
// is always originalPosition, so displacement fades as uRepulsion → 0.
const vertexShader = /* glsl */ `
attribute vec3 originalPosition;

uniform float uTime;
uniform vec3  uCursor;     // cursor world pos projected to z=0, in local space
uniform float uRepulsion;  // 0..1 smoothed interaction factor
uniform float uPointSize;  // base size in world-space units → scaled by projection

void main() {
    vec3 pos = originalPosition;

    // Subtle floating animation
    pos.y += sin(uTime * 0.5 + originalPosition.x * 3.0) * 0.1;

    // Smooth radial repulsion field (entirely on GPU — no CPU particle loop)
    vec3  delta  = pos - uCursor;
    float dist   = length(delta);
    float radius = 0.8;
    if (dist < radius && dist > 0.001) {
        float strength = 1.0 - dist / radius;
        strength = strength * strength;         // ease-in for a snappy feel
        pos += (delta / dist) * strength * 1.8 * uRepulsion;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Perspective-correct point size (mirrors THREE sizeAttenuation)
    gl_PointSize = uPointSize * projectionMatrix[1][1] / -mvPosition.z;
    gl_Position  = projectionMatrix * mvPosition;
}
`;

// ── Fragment shader ───────────────────────────────────────────────────────────
// Draws a soft circular disc using gl_PointCoord — no texture needed.
const fragmentShader = /* glsl */ `
uniform vec3  uColor;
uniform float uOpacity;

void main() {
    float dist  = length(gl_PointCoord - vec2(0.5));
    // Soft edge: fully opaque in centre, fades out toward radius 0.5
    float alpha = 1.0 - smoothstep(0.25, 0.5, dist);
    if (alpha < 0.001) discard;
    gl_FragColor = vec4(uColor, alpha * uOpacity);
}
`;

export default function Background3D({ theme, count }: Background3DProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Refs let the render loop read the latest props without restarting
    const themeRef = useRef(theme);
    const countRef = useRef(count);
    useEffect(() => {
        themeRef.current = theme;
    }, [theme]);
    useEffect(() => {
        countRef.current = count;
    }, [count]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // ── Renderer ────────────────────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: false,
            powerPreference: "high-performance"
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

        // ── Static particle positions (uploaded to GPU once, never touched again) ──
        const originalPositions = new Float32Array(PARTICLE_COUNT * 3);
        {
            const radius = 1.5;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const r = radius * Math.cbrt(Math.random());
                const theta = Math.random() * 2 * Math.PI;
                const phi = Math.acos(2 * Math.random() - 1);
                originalPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                originalPositions[i * 3 + 1] =
                    r * Math.sin(phi) * Math.sin(theta);
                originalPositions[i * 3 + 2] = r * Math.cos(phi);
            }
        }

        const geometry = new THREE.BufferGeometry();
        // `position` is required by Three.js internally for frustum culling etc.
        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(new Float32Array(originalPositions), 3)
        );
        // `originalPosition` is our custom attribute read by the vertex shader
        geometry.setAttribute(
            "originalPosition",
            new THREE.BufferAttribute(originalPositions, 3)
        );

        // ── Uniforms ─────────────────────────────────────────────────────────
        const isDark = () => themeRef.current === "dark";
        const currentColor = new THREE.Color(isDark() ? "#48bcff" : "#003d96");
        const targetColor = currentColor.clone();

        const uniforms = {
            uTime: { value: 0 },
            uCursor: { value: new THREE.Vector3(0, 0, 0) },
            uRepulsion: { value: 0 },
            uColor: { value: currentColor },
            uOpacity: { value: isDark() ? 0.25 : 1.0 },
            uPointSize: { value: 6.0 }
        };

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms,
            transparent: true,
            depthWrite: false
        });

        const group = new THREE.Group();
        group.rotation.z = Math.PI / 4;
        const points = new THREE.Points(geometry, material);
        group.add(points);
        scene.add(group);

        // ── Input state ──────────────────────────────────────────────────────
        const pointer = new THREE.Vector2(0, 0);
        let targetScale = 1;
        let interacting = false;

        const onMouseMove = (e: MouseEvent) => {
            pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
            pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                pointer.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
                pointer.y =
                    -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
            }
        };
        const onStart = () => {
            targetScale = 1.05;
            interacting = true;
        };
        const onEnd = () => {
            targetScale = 1.0;
            interacting = false;
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("touchmove", onTouchMove, { passive: true });
        window.addEventListener("mousedown", onStart);
        window.addEventListener("touchstart", onStart, { passive: true });
        window.addEventListener("mouseup", onEnd);
        window.addEventListener("touchend", onEnd);

        // ── Resize ───────────────────────────────────────────────────────────
        const onResize = () => {
            const w = canvas.clientWidth,
                h = canvas.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
        };
        const ro = new ResizeObserver(onResize);
        ro.observe(canvas);

        // ── Render loop ──────────────────────────────────────────────────────
        // CPU work per frame: rotation lerp + ONE raycaster call + uniform writes.
        // All per-particle physics lives in the vertex shader.
        const raycaster = new THREE.Raycaster();
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const worldCursor = new THREE.Vector3();
        const localCursor = new THREE.Vector3();

        let lastTime = performance.now();
        let elapsed = 0;
        let rafId: number;

        function animate() {
            rafId = requestAnimationFrame(animate);

            const now = performance.now();
            const delta = Math.min((now - lastTime) / 1000, 0.1);
            lastTime = now;
            elapsed += delta;

            // Color & opacity from current theme/count
            {
                const dark = isDark();
                const hueShift = (202 + countRef.current * 45) % 360;
                targetColor.setHSL(
                    hueShift / 360,
                    dark ? 0.9 : 0.8,
                    dark ? 0.55 : 0.4
                );
                uniforms.uOpacity.value = dark ? 0.25 : 1.0;
            }
            uniforms.uColor.value.lerp(targetColor, 0.05);

            // Rotation: passive drift + mouse parallax
            points.rotation.x -= delta / 20;
            points.rotation.y -= delta / 30;
            points.rotation.x +=
                0.05 * ((pointer.y * Math.PI) / 6 - points.rotation.x);
            points.rotation.y +=
                0.05 * ((pointer.x * Math.PI) / 6 - points.rotation.y);

            // Floating position & scale
            points.position.y = Math.sin(elapsed * 0.5) * 0.1;
            const ns = points.scale.x + 0.1 * (targetScale - points.scale.x);
            points.scale.setScalar(ns);

            // One raycaster call → cursor in particle local space → shader uniform
            raycaster.setFromCamera(pointer, camera);
            raycaster.ray.intersectPlane(plane, worldCursor);
            localCursor.copy(worldCursor);
            points.worldToLocal(localCursor);
            uniforms.uCursor.value.copy(localCursor);

            // Smooth repulsion factor (lerp toward 0 or 1)
            uniforms.uRepulsion.value +=
                0.1 * ((interacting ? 1.0 : 0.0) - uniforms.uRepulsion.value);

            uniforms.uTime.value = elapsed;

            renderer.render(scene, camera);
        }

        animate();

        // ── Cleanup ──────────────────────────────────────────────────────────
        return () => {
            cancelAnimationFrame(rafId);
            ro.disconnect();
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("mousedown", onStart);
            window.removeEventListener("touchstart", onStart);
            window.removeEventListener("mouseup", onEnd);
            window.removeEventListener("touchend", onEnd);
            geometry.dispose();
            material.dispose();
            renderer.dispose();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", display: "block" }}
            />
        </div>
    );
}
