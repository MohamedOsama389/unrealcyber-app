import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const seeded = (seed, salt = 0) => {
    const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
    return value - Math.floor(value);
};

const lerp = (a, b, t) => a + (b - a) * t;

const sampleBoxSurface = (a, b, c, width, height, depth) => {
    const face = Math.floor(a * 6);
    const u = b - 0.5;
    const v = c - 0.5;
    const hw = width * 0.5;
    const hh = height * 0.5;
    const hd = depth * 0.5;
    switch (face) {
        case 0: return [hw, u * height, v * depth];
        case 1: return [-hw, u * height, v * depth];
        case 2: return [u * width, hh, v * depth];
        case 3: return [u * width, -hh, v * depth];
        case 4: return [u * width, v * height, hd];
        default: return [u * width, v * height, -hd];
    }
};

const rectEdgePoint = (t, width, height) => {
    const p = (t % 1) * 4;
    const hw = width * 0.5;
    const hh = height * 0.5;
    if (p < 1) return [-hw + p * width, -hh];
    if (p < 2) return [hw, -hh + (p - 1) * height];
    if (p < 3) return [hw - (p - 2) * width, hh];
    return [-hw, hh - (p - 3) * height];
};

/**
 * ParticleMorph — Elite particle system.
 * Shapes are high-fidelity reproductions of the reference images:
 *   Networking  → Stacked router/switch with antennas + LED ports
 *   Hacking     → Shield with embedded padlock + keyhole
 *   Programming → Laptop with </> code symbol on the screen
 *
 * Desktop: shapes assemble to the RIGHT of the card.
 * Mobile:  shapes assemble ABOVE the card.
 */
const ParticleMorph = ({ scrollProgress = 0 }) => {
    const pointsRef = useRef();
    const materialRef = useRef();
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
    const COUNT = isMobile ? 4500 : 10000;

    const colors = useMemo(() => ({
        networking: new THREE.Color('#22d3ee'),
        hacking: new THREE.Color('#c084fc'),
        programming: new THREE.Color('#60a5fa'),
        ambient: new THREE.Color('#e2e8f0')
    }), []);

    const targets = useMemo(() => {
        const net = new Float32Array(COUNT * 3);
        const hack = new Float32Array(COUNT * 3);
        const prog = new Float32Array(COUNT * 3);
        const rand = new Float32Array(COUNT * 3);
        const amb = new Float32Array(COUNT * 3);

        for (let i = 0; i < COUNT; i++) {
            const i3 = i * 3;
            const sr = (salt) => seeded(i, salt);

            // Scattered random field (biased right on desktop)
            rand[i3] = (sr(1) - 0.5) * 18 + (isMobile ? 0 : 6);
            rand[i3 + 1] = (sr(2) - 0.5) * 14;
            rand[i3 + 2] = (sr(3) - 0.5) * 12;

            // Calm ambient field for hero/footer
            amb[i3] = (sr(4) - 0.5) * 28 + (isMobile ? 0 : 2);
            amb[i3 + 1] = (sr(5) - 0.5) * 16;
            amb[i3 + 2] = (sr(6) - 0.5) * 14;

            // ═══════════════════════════════════════════════
            // NETWORKING — Stacked Router/Switch
            // Reference: Two stacked rectangular boxes, two tall antennas,
            //            rows of LED indicator lights on front face
            // ═══════════════════════════════════════════════
            const netFrac = i / COUNT;
            if (netFrac < 0.25) {
                // Bottom box (larger)
                const [x, y, z] = sampleBoxSurface(sr(7), sr(8), sr(9), 5.5, 1.0, 3.2);
                net[i3] = x;
                net[i3 + 1] = y - 1.4;
                net[i3 + 2] = z;
            } else if (netFrac < 0.50) {
                // Top box (slightly narrower)
                const [x, y, z] = sampleBoxSurface(sr(10), sr(11), sr(12), 5.0, 0.9, 2.8);
                net[i3] = x;
                net[i3 + 1] = y + 0.1;
                net[i3 + 2] = z;
            } else if (netFrac < 0.62) {
                // Left antenna
                const spread = 0.08;
                net[i3] = -1.6 + (sr(13) - 0.5) * spread;
                net[i3 + 1] = 0.5 + sr(14) * 3.8;
                net[i3 + 2] = (sr(15) - 0.5) * spread;
            } else if (netFrac < 0.74) {
                // Right antenna
                const spread = 0.08;
                net[i3] = 1.6 + (sr(16) - 0.5) * spread;
                net[i3 + 1] = 0.5 + sr(17) * 3.8;
                net[i3 + 2] = (sr(18) - 0.5) * spread;
            } else if (netFrac < 0.88) {
                // LED port lights on front faces of both boxes
                const onTop = sr(19) > 0.5;
                const row = onTop ? 0.1 : -1.4;
                const numSlots = 10;
                const slot = Math.floor(sr(20) * numSlots);
                net[i3] = -2.2 + slot * (4.4 / numSlots) + (sr(21) - 0.5) * 0.12;
                net[i3 + 1] = row + (sr(22) - 0.5) * 0.25;
                net[i3 + 2] = (onTop ? 1.41 : 1.61);
            } else {
                // Ambient haze around the device
                net[i3] = (sr(23) - 0.5) * 7;
                net[i3 + 1] = (sr(24) - 0.5) * 6;
                net[i3 + 2] = (sr(25) - 0.5) * 5;
            }

            // ═══════════════════════════════════════════════
            // HACKING — Shield + Lock
            // Reference: Thick shield outline with pointed base,
            //            padlock body centered inside, arch shackle on top,
            //            small circular keyhole
            // ═══════════════════════════════════════════════
            const hackFrac = i / COUNT;
            if (hackFrac < 0.40) {
                // SHIELD OUTLINE — thick border of the shield
                const theta = sr(26) * Math.PI * 2;
                const baseR = 2.8 + (sr(27) - 0.5) * 0.35;
                let x = Math.cos(theta) * baseR;
                let y = Math.sin(theta) * baseR * 1.15 + 0.2;
                // Pointed bottom
                if (y < -0.3) {
                    const depth = Math.abs(y + 0.3);
                    x *= Math.max(0.15, 1 - depth * 0.35);
                    y -= depth * 0.5;
                }
                hack[i3] = x;
                hack[i3 + 1] = y;
                hack[i3 + 2] = (sr(28) - 0.5) * 0.3;
            } else if (hackFrac < 0.62) {
                // LOCK BODY — rectangular block inside lower shield
                const bw = 1.6, bh = 1.3;
                const [ex, ey] = rectEdgePoint(sr(29), bw, bh);
                const fill = sr(30) < 0.6;
                hack[i3] = fill ? (sr(31) - 0.5) * bw : ex;
                hack[i3 + 1] = (fill ? (sr(32) - 0.5) * bh : ey) - 0.4;
                hack[i3 + 2] = 0.15 + (sr(33) - 0.5) * 0.15;
            } else if (hackFrac < 0.80) {
                // SHACKLE — arch on top of lock body
                const angle = sr(34) * Math.PI;
                const r = 0.7 + (sr(35) - 0.5) * 0.12;
                hack[i3] = Math.cos(angle) * r;
                hack[i3 + 1] = 0.25 + Math.sin(angle) * r;
                hack[i3 + 2] = 0.15 + (sr(36) - 0.5) * 0.08;
            } else if (hackFrac < 0.92) {
                // KEYHOLE — circle + wedge
                if (sr(37) < 0.55) {
                    const a = sr(38) * Math.PI * 2;
                    const kr = 0.2 + sr(39) * 0.05;
                    hack[i3] = Math.cos(a) * kr;
                    hack[i3 + 1] = -0.2 + Math.sin(a) * kr;
                } else {
                    hack[i3] = (sr(40) - 0.5) * 0.12;
                    hack[i3 + 1] = -0.4 - sr(41) * 0.5;
                }
                hack[i3 + 2] = 0.3;
            } else {
                // Ambient haze
                hack[i3] = (sr(42) - 0.5) * 7;
                hack[i3 + 1] = (sr(43) - 0.5) * 7;
                hack[i3 + 2] = (sr(44) - 0.5) * 5;
            }

            // ═══════════════════════════════════════════════
            // PROGRAMMING — Laptop + </> Symbol
            // Reference: Open laptop with screen tilted back,
            //            keyboard base slab, </> code symbol centered on screen
            // ═══════════════════════════════════════════════
            const progFrac = i / COUNT;
            if (progFrac < 0.22) {
                // KEYBOARD BASE — flat slab with slight 3D depth
                const [x, y, z] = sampleBoxSurface(sr(45), sr(46), sr(47), 6.5, 0.3, 4);
                prog[i3] = x;
                prog[i3 + 1] = -2.2 + y;
                prog[i3 + 2] = z + 1.2;
            } else if (progFrac < 0.38) {
                // Keyboard surface details (key rows)
                const col = Math.floor(sr(48) * 12);
                const row = Math.floor(sr(49) * 4);
                prog[i3] = -2.8 + col * 0.5 + (sr(50) - 0.5) * 0.15;
                prog[i3 + 1] = -2.15;
                prog[i3 + 2] = 0.2 + row * 0.8 + (sr(51) - 0.5) * 0.2;
            } else if (progFrac < 0.56) {
                // SCREEN FRAME — rectangle outline
                const [x, y] = rectEdgePoint(sr(52), 6, 4.2);
                prog[i3] = x;
                prog[i3 + 1] = y + 0.6;
                prog[i3 + 2] = -1.8;
            } else if (progFrac < 0.72) {
                // SCREEN SURFACE — filled area behind the symbol
                prog[i3] = (sr(53) - 0.5) * 5.5;
                prog[i3 + 1] = (sr(54) - 0.5) * 3.6 + 0.6;
                prog[i3 + 2] = -1.78;
            } else if (progFrac < 0.92) {
                // CODE SYMBOL — < / >
                const glyph = sr(55);
                let gx = 0, gy = 0;
                if (glyph < 0.35) {
                    // < bracket
                    const t = glyph / 0.35;
                    const peak = t < 0.5 ? t * 2 : (1 - t) * 2;
                    gx = lerp(-0.3, -1.5, peak);
                    gy = lerp(1.2, -1.2, t);
                } else if (glyph < 0.5) {
                    // / slash
                    const t = (glyph - 0.35) / 0.15;
                    gx = lerp(0.4, -0.4, t);
                    gy = lerp(1.2, -1.2, t);
                } else if (glyph < 0.85) {
                    // > bracket
                    const t = (glyph - 0.5) / 0.35;
                    const peak = t < 0.5 ? t * 2 : (1 - t) * 2;
                    gx = lerp(0.3, 1.5, peak);
                    gy = lerp(1.2, -1.2, t);
                } else {
                    // Extra dots around the symbol for density
                    gx = (sr(56) - 0.5) * 2.5;
                    gy = (sr(57) - 0.5) * 2;
                }
                prog[i3] = gx * 1.2 + (sr(58) - 0.5) * 0.06;
                prog[i3 + 1] = gy * 1.0 + 0.6 + (sr(59) - 0.5) * 0.06;
                prog[i3 + 2] = -1.7;
            } else {
                // Ambient haze
                prog[i3] = (sr(60) - 0.5) * 8;
                prog[i3 + 1] = (sr(61) - 0.5) * 7;
                prog[i3 + 2] = (sr(62) - 0.5) * 6;
            }
        }

        return { rand, amb, net, hack, prog };
    }, [isMobile, COUNT]);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;
        const pos = pointsRef.current.geometry.attributes.position.array;
        const t = state.clock.getElapsedTime();

        let target, color;
        let progress = 0;

        if (scrollProgress < 0.45) {
            target = targets.net;
            progress = scrollProgress / 0.45;
            color = colors.networking;
        } else if (scrollProgress < 0.75) {
            target = targets.hack;
            progress = (scrollProgress - 0.45) / 0.30;
            color = colors.hacking;
        } else {
            target = targets.prog;
            progress = (scrollProgress - 0.75) / 0.25;
            color = colors.programming;
        }

        // Assembly factor: 1.0 at the center of each section, 0 at edges
        // Increased sharp exponent for a "tighter" assembly feel in the middle
        const assembly = Math.pow(Math.sin(progress * Math.PI), 0.5);

        // Ambient blend for hero (top) and footer (bottom)
        const topFade = THREE.MathUtils.clamp((0.12 - scrollProgress) / 0.12, 0, 1);
        const botFade = THREE.MathUtils.clamp((scrollProgress - 0.88) / 0.12, 0, 1);
        const ambientBlend = Math.max(topFade, botFade);

        const mobile = state.size.width < 1024;
        // *** KEY FIX: positive xOffset pushes particles to the RIGHT of the card ***
        const xOff = mobile ? 0 : 6.5;
        const yOff = mobile ? 3.5 : 0;

        // Stronger attraction = faster assembly. Scale with assembly factor.
        const dt = Math.min(delta, 0.05);
        const baseSpeed = dt * 2.5;
        const shapeSpeed = baseSpeed * (0.8 + assembly * 3.5);
        const ambSpeed = baseSpeed * 0.35;
        const speed = THREE.MathUtils.lerp(shapeSpeed, ambSpeed, ambientBlend);

        for (let i = 0; i < COUNT; i++) {
            const i3 = i * 3;
            const wave = Math.sin(t * 0.3 + i * 0.02) * 0.012;

            const sx = target[i3] + xOff;
            const sy = target[i3 + 1] + yOff;
            const sz = target[i3 + 2];

            const ax = targets.amb[i3] + Math.sin(t * 0.15 + i * 0.01) * 0.8;
            const ay = targets.amb[i3 + 1] + Math.cos(t * 0.18 + i * 0.013) * 0.6;
            const az = targets.amb[i3 + 2] + Math.sin(t * 0.12 + i * 0.017) * 0.4;

            const tx = THREE.MathUtils.lerp(sx, ax, ambientBlend);
            const ty = THREE.MathUtils.lerp(sy, ay, ambientBlend);
            const tz = THREE.MathUtils.lerp(sz, az, ambientBlend);

            pos[i3] += (tx - pos[i3]) * speed + wave;
            pos[i3 + 1] += (ty - pos[i3 + 1]) * speed + wave * 0.7;
            pos[i3 + 2] += (tz - pos[i3 + 2]) * speed + wave * 0.5;

            // Between sections: drift towards scatter
            if (ambientBlend < 0.3 && assembly < 0.15) {
                const scatter = baseSpeed * 0.3;
                pos[i3] += (targets.rand[i3] - pos[i3]) * scatter;
                pos[i3 + 1] += (targets.rand[i3 + 1] - pos[i3 + 1]) * scatter;
                pos[i3 + 2] += (targets.rand[i3 + 2] - pos[i3 + 2]) * scatter;
            }
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;

        // Color lerp
        if (materialRef.current) {
            const tgt = ambientBlend > 0.5 ? colors.ambient : color;
            materialRef.current.color.lerp(tgt, 0.06);
        }

        // Gentle Y rotation
        const rotTarget = mobile ? 0 : (scrollProgress - 0.5) * 0.6;
        pointsRef.current.rotation.y = THREE.MathUtils.lerp(
            pointsRef.current.rotation.y, rotTarget, 0.02
        );
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={COUNT}
                    array={targets.rand}
                    itemSize={3}
                />
            </bufferGeometry>
            <PointMaterial
                ref={materialRef}
                size={isMobile ? 0.08 : 0.1}
                color="#ffffff"
                transparent
                opacity={0.92}
                sizeAttenuation
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
            />
        </points>
    );
};

export default ParticleMorph;
