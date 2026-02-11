import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * GatewayCanvas
 * Premium network gateway animation for the hero.
 * - Neon gateway ring + orb pulses.
 * - Sparse particles with parallax.
 * - Listens to pointer for light tilt.
 * - Respects prefers-reduced-motion.
 */
const GatewayCanvas = () => {
    const ref = useRef(null);
    const reducedMotion = typeof window !== 'undefined'
        && window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    useEffect(() => {
        if (!ref.current || reducedMotion) return undefined;

        const container = ref.current;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(22, container.clientWidth / container.clientHeight, 0.1, 100);
        camera.position.set(0, 0, 12);

        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        // Gateway ring
        const ringGeo = new THREE.TorusGeometry(3.2, 0.12, 48, 220);
        const ringMat = new THREE.MeshBasicMaterial({ color: '#00e5ff', transparent: true, opacity: 0.45 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.3;
        scene.add(ring);

        // Shield orb
        const orbGeo = new THREE.IcosahedronGeometry(1.8, 1);
        const orbMat = new THREE.MeshPhysicalMaterial({
            color: '#7c5cff',
            emissive: '#3f2fa8',
            emissiveIntensity: 0.35,
            metalness: 0.7,
            roughness: 0.18,
            transmission: 0.28,
            thickness: 0.6,
            clearcoat: 0.5
        });
        const orb = new THREE.Mesh(orbGeo, orbMat);
        scene.add(orb);

        // Particles
        const pGeo = new THREE.BufferGeometry();
        const count = 120;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 14;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const pMat = new THREE.PointsMaterial({ color: '#6ae0ff', size: 0.06, transparent: true, opacity: 0.7 });
        const particles = new THREE.Points(pGeo, pMat);
        scene.add(particles);

        const ambient = new THREE.AmbientLight('#eaf0ff', 0.45);
        const key = new THREE.PointLight('#00e5ff', 1.1, 40);
        key.position.set(5, 4, 10);
        const fill = new THREE.PointLight('#7c5cff', 0.9, 30);
        fill.position.set(-6, -2, 8);
        scene.add(ambient, key, fill);

        const target = { x: 0, y: 0 };
        const onPointer = (e) => {
            const rect = container.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            target.x = y * 0.35;
            target.y = x * 0.55;
        };
        window.addEventListener('pointermove', onPointer);

        const onResize = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        const clock = new THREE.Clock();
        let frame;
        const animate = () => {
            frame = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();
            ring.rotation.z = Math.sin(t * 0.5) * 0.12;
            ring.material.opacity = 0.35 + Math.sin(t * 1.2) * 0.08;
            orb.rotation.x += 0.0035;
            orb.rotation.y += 0.0045;
            particles.rotation.y += 0.0008;
            scene.rotation.x += (target.x - scene.rotation.x) * 0.06;
            scene.rotation.y += (target.y - scene.rotation.y) * 0.06;
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('pointermove', onPointer);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
            ringGeo.dispose(); orbGeo.dispose(); pGeo.dispose();
            ringMat.dispose(); orbMat.dispose(); pMat.dispose();
            if (renderer.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        };
    }, [reducedMotion]);

    return (
        <div
            ref={ref}
            className="w-full h-[320px] md:h-[420px] lg:h-[500px] rounded-3xl border border-white/10 relative overflow-hidden bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-950/90"
        >
            {reducedMotion && (
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-purple-600/10" />
            )}
        </div>
    );
};

export default GatewayCanvas;
