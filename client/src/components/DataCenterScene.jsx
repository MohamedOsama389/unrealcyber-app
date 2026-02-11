import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * DataCenterScene
 * - Floating routers/switches (simple neon boxes) you can click to "collect".
 * - Hover glow and click pulse.
 * - Emits onCollect callback with item meta.
 * - Scroll-friendly: lightweight, no post-processing.
 */
const routerMeta = [
    { id: 'router-1', title: 'Router Fundamentals', desc: 'Ports, routing tables, and secure configs.' },
    { id: 'switch-1', title: 'Switching Protocols', desc: 'VLANs, STP, and segmentation.' },
    { id: 'firewall-1', title: 'Firewall Basics', desc: 'Rulesets, NAT, and inspection.' },
];

const DataCenterScene = ({ onCollect }) => {
    const mountRef = useRef(null);
    const reduced = useReducedMotion();

    useEffect(() => {
        if (!mountRef.current || reduced) return;

        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
        renderer.setClearColor(0x000000, 0);
        mountRef.current.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(25, w / h, 0.1, 100);
        camera.position.set(0, 0.5, 14);

        const ambient = new THREE.AmbientLight('#eaf0ff', 0.5);
        const key = new THREE.PointLight('#00e5ff', 1.2, 30);
        key.position.set(6, 4, 10);
        const fill = new THREE.PointLight('#7c5cff', 1.0, 28);
        fill.position.set(-6, -3, 8);
        scene.add(ambient, key, fill);

        // Floor grid
        const grid = new THREE.GridHelper(40, 40, '#0d3b4f', '#0d3b4f');
        grid.position.y = -3;
        scene.add(grid);

        const boxGeo = new THREE.BoxGeometry(2.4, 0.8, 1.2);
        const neonMat = new THREE.MeshStandardMaterial({
            color: '#0adfff',
            emissive: '#0b9ed8',
            emissiveIntensity: 0.5,
            metalness: 0.6,
            roughness: 0.25,
        });

        const outlineMat = new THREE.LineBasicMaterial({ color: '#7c5cff' });

        const pickables = [];
        routerMeta.forEach((meta, idx) => {
            const mesh = new THREE.Mesh(boxGeo, neonMat.clone());
            mesh.position.set((idx - 1) * 4, Math.sin(idx) * 0.6, -idx * 1.2);
            mesh.userData = meta;
            scene.add(mesh);

            const edges = new THREE.EdgesGeometry(boxGeo);
            const outline = new THREE.LineSegments(edges, outlineMat.clone());
            outline.position.copy(mesh.position);
            scene.add(outline);

            pickables.push({ mesh, outline, hover: false, pulse: 0 });
        });

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();

        const handleMove = (event) => {
            const rect = renderer.domElement.getBoundingClientRect();
            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        };

        const handleClick = () => {
            raycaster.setFromCamera(pointer, camera);
            const intersects = raycaster.intersectObjects(pickables.map(p => p.mesh));
            if (intersects.length > 0) {
                const mesh = intersects[0].object;
                const meta = mesh.userData;
                const target = pickables.find(p => p.mesh === mesh);
                if (target) target.pulse = 1.2;
                if (onCollect) onCollect(meta);
            }
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('click', handleClick);

        const clock = new THREE.Clock();
        let frame;
        const animate = () => {
            frame = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();
            pickables.forEach((p, idx) => {
                p.mesh.rotation.y = Math.sin(t * 0.4 + idx) * 0.08;
                p.mesh.position.y = Math.sin(t * 0.6 + idx) * 0.5;
                p.outline.position.copy(p.mesh.position);
                raycaster.setFromCamera(pointer, camera);
                const hit = raycaster.intersectObject(p.mesh).length > 0;
                p.hover = hit;
                p.mesh.material.emissiveIntensity = hit ? 0.9 : 0.5;
                p.outline.material.opacity = hit ? 1 : 0.55;
                if (p.pulse > 0) {
                    p.mesh.scale.setScalar(1 + 0.12 * p.pulse);
                    p.pulse *= 0.92;
                } else {
                    p.mesh.scale.setScalar(1);
                }
            });
            renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
            const w2 = mountRef.current.clientWidth;
            const h2 = mountRef.current.clientHeight;
            camera.aspect = w2 / h2;
            camera.updateProjectionMatrix();
            renderer.setSize(w2, h2);
        };
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
            boxGeo.dispose();
            neonMat.dispose();
            outlineMat.dispose();
            if (renderer.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        };
    }, [onCollect, reduced]);

    return (
        <div
            ref={mountRef}
            className="w-full h-[420px] md:h-[520px] rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900/80 to-slate-950/90 overflow-hidden"
            aria-label="Data Center interactive scene"
        >
            {reduced && (
                <div className="absolute inset-0 flex items-center justify-center text-secondary text-sm">
                    Interactive scene disabled (reduced motion).
                </div>
            )}
        </div>
    );
};

export default DataCenterScene;
