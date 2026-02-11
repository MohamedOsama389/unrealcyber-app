import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Hero3D = () => {
    const containerRef = useRef(null);
    const prefersReducedMotion = typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    useEffect(() => {
        if (!containerRef.current || prefersReducedMotion) return;

        let frameId;
        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2('#05080f', 0.08);

        const camera = new THREE.PerspectiveCamera(22, width / height, 0.1, 100);
        camera.position.set(0, 0, 12);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        const coreGroup = new THREE.Group();
        scene.add(coreGroup);

        const coreGeo = new THREE.TorusKnotGeometry(1.8, 0.42, 160, 32);
        const coreMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#4de1ff'),
            metalness: 0.85,
            roughness: 0.2,
            transmission: 0.25,
            thickness: 0.45,
            clearcoat: 0.4,
            emissive: new THREE.Color('#0ad'),
            emissiveIntensity: 0.15
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        coreGroup.add(coreMesh);

        const ringGeo = new THREE.RingGeometry(3.2, 3.5, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: '#7c5cff', side: THREE.DoubleSide, opacity: 0.35, transparent: true });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.6;
        coreGroup.add(ring);

        const particlesGeo = new THREE.BufferGeometry();
        const PARTICLE_COUNT = 140;
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 14;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
        }
        particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particlesMat = new THREE.PointsMaterial({
            color: '#6ae0ff',
            size: 0.05,
            transparent: true,
            opacity: 0.7
        });
        const particles = new THREE.Points(particlesGeo, particlesMat);
        scene.add(particles);

        const ambient = new THREE.AmbientLight('#eaf0ff', 0.45);
        scene.add(ambient);
        const keyLight = new THREE.PointLight('#00e5ff', 1.1, 30);
        keyLight.position.set(6, 4, 8);
        scene.add(keyLight);
        const fillLight = new THREE.PointLight('#7c5cff', 0.9, 25);
        fillLight.position.set(-6, -3, 6);
        scene.add(fillLight);

        const targetRotation = { x: 0, y: 0 };
        const onPointerMove = (event) => {
            const rect = container.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;
            targetRotation.x = (y - 0.5) * 0.4;
            targetRotation.y = (x - 0.5) * 0.6;
        };
        window.addEventListener('pointermove', onPointerMove);

        const onResize = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        const clock = new THREE.Clock();
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();
            coreGroup.rotation.x += (targetRotation.x - coreGroup.rotation.x) * 0.05;
            coreGroup.rotation.y += (targetRotation.y - coreGroup.rotation.y) * 0.05;
            coreMesh.rotation.y += 0.0045;
            coreMesh.rotation.x += 0.0025;
            ring.rotation.z = Math.sin(t * 0.4) * 0.15;
            particles.rotation.y += 0.0008;
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
            coreGeo.dispose();
            ringGeo.dispose();
            particlesGeo.dispose();
            coreMat.dispose();
            ringMat.dispose();
            particlesMat.dispose();
            if (renderer.domElement && renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }
        };
    }, [prefersReducedMotion]);

    return (
        <div
            ref={containerRef}
            className="w-full h-[320px] md:h-[440px] lg:h-[520px] rounded-3xl border border-white/10 relative overflow-hidden"
        >
            {prefersReducedMotion && (
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-slate-900 to-purple-600/10" />
            )}
        </div>
    );
};

export default Hero3D;
