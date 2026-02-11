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
        case 0:
            return [hw, u * height, v * depth];
        case 1:
            return [-hw, u * height, v * depth];
        case 2:
            return [u * width, hh, v * depth];
        case 3:
            return [u * width, -hh, v * depth];
        case 4:
            return [u * width, v * height, hd];
        default:
            return [u * width, v * height, -hd];
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
 * ParticleMorph
 * Premium WebGL particle system that morphs between section-aligned 3D silhouettes.
 */
const ParticleMorph = ({ scrollProgress = 0 }) => {
    const pointsRef = useRef();
    const materialRef = useRef();
    const isMobileViewport = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
    const particleCount = isMobileViewport ? 3200 : 6400;

    const colors = useMemo(() => ({
        networking: new THREE.Color('#dff3ff'),
        hacking: new THREE.Color('#c97bff'),
        programming: new THREE.Color('#bde8ff'),
        ambient: new THREE.Color('#f2f8ff')
    }), []);

    const targets = useMemo(() => {
        const networking = new Float32Array(particleCount * 3);
        const hacking = new Float32Array(particleCount * 3);
        const programming = new Float32Array(particleCount * 3);
        const random = new Float32Array(particleCount * 3);
        const ambient = new Float32Array(particleCount * 3);

        const randomRightBias = isMobileViewport ? 0 : 7.2;
        const ambientBias = isMobileViewport ? 0 : 1.8;

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const sr = (salt) => seeded(i, salt);

            // Scatter state used between section transitions.
            random[i3] = (sr(1) - 0.5) * 13 + randomRightBias;
            random[i3 + 1] = (sr(2) - 0.5) * 11;
            random[i3 + 2] = (sr(3) - 0.5) * 10;

            // Ambient state for top and footer: wide, calm field.
            ambient[i3] = (sr(4) - 0.5) * 22 + ambientBias;
            ambient[i3 + 1] = (sr(5) - 0.5) * 12;
            ambient[i3 + 2] = (sr(6) - 0.5) * 10;

            // Networking: stacked router/switch silhouette with antennas and port rows.
            if (i < particleCount * 0.28) {
                const [x, y, z] = sampleBoxSurface(sr(7), sr(8), sr(9), 6.4, 1.1, 3.6);
                networking[i3] = x;
                networking[i3 + 1] = y - 1.25;
                networking[i3 + 2] = z;
            } else if (i < particleCount * 0.58) {
                const [x, y, z] = sampleBoxSurface(sr(10), sr(11), sr(12), 5.5, 1.0, 3.2);
                networking[i3] = x;
                networking[i3 + 1] = y - 0.1;
                networking[i3 + 2] = z;
            } else if (i < particleCount * 0.72) {
                const side = sr(13) > 0.5 ? 1 : -1;
                networking[i3] = side * (1.75 + (sr(14) - 0.5) * 0.1);
                networking[i3 + 1] = 0.65 + sr(15) * 3.1;
                networking[i3 + 2] = (sr(16) - 0.5) * 0.12;
            } else if (i < particleCount * 0.84) {
                networking[i3] = -2.15 + sr(17) * 4.3;
                networking[i3 + 1] = 0.05 + (sr(18) - 0.5) * 0.2;
                networking[i3 + 2] = 1.62 + (sr(19) - 0.5) * 0.05;
            } else if (i < particleCount * 0.94) {
                const slot = Math.floor(sr(20) * 8);
                networking[i3] = -2.35 + slot * 0.67 + (sr(21) - 0.5) * 0.05;
                networking[i3 + 1] = -1.32 + (sr(22) - 0.5) * 0.14;
                networking[i3 + 2] = 1.82 + (sr(23) - 0.5) * 0.05;
            } else {
                networking[i3] = (sr(24) - 0.5) * 8;
                networking[i3 + 1] = (sr(25) - 0.5) * 5 - 0.2;
                networking[i3 + 2] = (sr(26) - 0.5) * 4;
            }

            // Ethical hacking: shield outline + lock + keyhole.
            if (i < particleCount * 0.56) {
                const theta = sr(27) * Math.PI * 2;
                const radius = 2.45 + (sr(28) - 0.5) * 0.16;
                let x = Math.cos(theta) * radius;
                let y = Math.sin(theta) * (radius * 1.12) - 0.22;
                if (y < -0.1) {
                    y *= 1.18;
                    x *= 0.8;
                }
                hacking[i3] = x;
                hacking[i3 + 1] = y;
                hacking[i3 + 2] = (sr(29) - 0.5) * 0.18;
            } else if (i < particleCount * 0.74) {
                const theta = sr(30) * Math.PI * 2;
                const radius = sr(31) * 1.6 + 0.3;
                let x = Math.cos(theta) * radius * 0.66;
                let y = Math.sin(theta) * radius * 0.82 - 0.05;
                if (y < -0.05) {
                    y *= 1.12;
                    x *= 0.9;
                }
                hacking[i3] = x;
                hacking[i3 + 1] = y;
                hacking[i3 + 2] = 0.12 + (sr(32) - 0.5) * 0.08;
            } else if (i < particleCount * 0.86) {
                const [x, y] = rectEdgePoint(sr(33), 1.9, 1.9);
                hacking[i3] = x;
                hacking[i3 + 1] = y - 0.1;
                hacking[i3 + 2] = 0.18 + (sr(34) - 0.5) * 0.06;
            } else if (i < particleCount * 0.94) {
                if (sr(35) < 0.72) {
                    const angle = Math.PI * (0.12 + sr(36) * 0.76);
                    hacking[i3] = Math.cos(angle) * 0.98;
                    hacking[i3 + 1] = 0.86 + Math.sin(angle) * 0.95;
                } else {
                    const side = sr(36) > 0.5 ? 1 : -1;
                    hacking[i3] = side * 0.98;
                    hacking[i3 + 1] = 0.9 + sr(37) * 0.8;
                }
                hacking[i3 + 2] = 0.2 + (sr(38) - 0.5) * 0.06;
            } else {
                if (sr(39) < 0.58) {
                    const a = sr(40) * Math.PI * 2;
                    const rr = 0.18 + sr(41) * 0.05;
                    hacking[i3] = Math.cos(a) * rr;
                    hacking[i3 + 1] = -0.08 + Math.sin(a) * rr;
                } else {
                    hacking[i3] = (sr(42) - 0.5) * 0.08;
                    hacking[i3 + 1] = -0.1 - sr(43) * 0.5;
                }
                hacking[i3 + 2] = 0.24 + (sr(44) - 0.5) * 0.04;
            }

            // Programming: laptop outline with base slab and code glyphs.
            if (i < particleCount * 0.34) {
                const [x, y] = rectEdgePoint(sr(45), 6.2, 3.6);
                programming[i3] = x;
                programming[i3 + 1] = y + 1.35;
                programming[i3 + 2] = -1.95 + (sr(46) - 0.5) * 0.06;
            } else if (i < particleCount * 0.52) {
                programming[i3] = (sr(47) - 0.5) * 5.6;
                programming[i3 + 1] = (sr(48) - 0.5) * 3 + 1.35;
                programming[i3 + 2] = -1.98 + (sr(49) - 0.5) * 0.05;
            } else if (i < particleCount * 0.76) {
                const [x, y, z] = sampleBoxSurface(sr(50), sr(51), sr(52), 7.4, 0.55, 3.3);
                programming[i3] = x;
                programming[i3 + 1] = y - 1.6 + z * 0.035;
                programming[i3 + 2] = z + 1.15;
            } else if (i < particleCount * 0.84) {
                programming[i3] = -2.85 + sr(53) * 5.7;
                programming[i3 + 1] = -1.22 + (sr(54) - 0.5) * 0.05;
                programming[i3 + 2] = -0.2 + (sr(55) - 0.5) * 0.05;
            } else if (i < particleCount * 0.94) {
                const glyph = sr(56);
                let gx = 0;
                let gy = 0;

                if (glyph < 0.35) {
                    const t = (glyph / 0.35) * 2;
                    if (t < 1) {
                        gx = lerp(-0.2, -0.78, t);
                        gy = lerp(0.32, 0, t);
                    } else {
                        gx = lerp(-0.78, -0.2, t - 1);
                        gy = lerp(0, -0.32, t - 1);
                    }
                } else if (glyph < 0.7) {
                    const t = ((glyph - 0.35) / 0.35) * 2;
                    if (t < 1) {
                        gx = lerp(0.2, 0.78, t);
                        gy = lerp(0.32, 0, t);
                    } else {
                        gx = lerp(0.78, 0.2, t - 1);
                        gy = lerp(0, -0.32, t - 1);
                    }
                } else {
                    const t = (glyph - 0.7) / 0.3;
                    gx = lerp(-0.05, 0.25, t);
                    gy = lerp(-0.34, 0.34, t);
                }

                programming[i3] = gx * 2.05 + (sr(57) - 0.5) * 0.05;
                programming[i3 + 1] = gy * 2.05 + 1.35 + (sr(58) - 0.5) * 0.05;
                programming[i3 + 2] = -1.88 + (sr(59) - 0.5) * 0.05;
            } else {
                programming[i3] = (sr(60) - 0.5) * 8.2;
                programming[i3 + 1] = (sr(61) - 0.5) * 5.2 - 0.1;
                programming[i3 + 2] = (sr(62) - 0.5) * 4.5;
            }
        }

        return { random, ambient, networking, hacking, programming };
    }, [isMobileViewport, particleCount]);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;

        const positions = pointsRef.current.geometry.attributes.position.array;
        const t = state.clock.getElapsedTime();

        let targetBuffer;
        let progressInSection = 0;
        let sectionColor = colors.programming;

        if (scrollProgress < 0.33) {
            targetBuffer = targets.networking;
            progressInSection = scrollProgress / 0.33;
            sectionColor = colors.networking;
        } else if (scrollProgress < 0.66) {
            targetBuffer = targets.hacking;
            progressInSection = (scrollProgress - 0.33) / 0.33;
            sectionColor = colors.hacking;
        } else {
            targetBuffer = targets.programming;
            progressInSection = (scrollProgress - 0.66) / 0.34;
            sectionColor = colors.programming;
        }

        const assemblyFactor = Math.pow(Math.sin(progressInSection * Math.PI), 0.58);
        const topEdge = THREE.MathUtils.clamp((0.14 - scrollProgress) / 0.14, 0, 1);
        const bottomEdge = THREE.MathUtils.clamp((scrollProgress - 0.86) / 0.14, 0, 1);
        const ambientBlend = Math.max(topEdge, bottomEdge);

        const baseLerp = THREE.MathUtils.clamp(delta * 1.1, 0.0025, 0.018);
        const isMobile = state.size.width < 1024;
        const xOffset = isMobile ? 0 : 6.5;
        const yOffset = isMobile ? 3.1 : -0.05;

        const shapeAttraction = baseLerp * (0.68 + assemblyFactor * 0.62);
        const ambientAttraction = baseLerp * 0.34;
        const attraction = THREE.MathUtils.lerp(shapeAttraction, ambientAttraction, ambientBlend);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            const waveA = Math.sin(t * 0.22 + i * 0.013);
            const waveB = Math.cos(t * 0.26 + i * 0.017);
            const waveC = Math.sin(t * 0.18 + i * 0.021);

            const ambientX = targets.ambient[i3] + waveA * 1.15;
            const ambientY = targets.ambient[i3 + 1] + waveB * 0.95;
            const ambientZ = targets.ambient[i3 + 2] + waveC * 0.75;

            const shapeX = targetBuffer[i3] + xOffset;
            const shapeY = targetBuffer[i3 + 1] + yOffset;
            const shapeZ = targetBuffer[i3 + 2];

            const targetX = THREE.MathUtils.lerp(shapeX, ambientX, ambientBlend);
            const targetY = THREE.MathUtils.lerp(shapeY, ambientY, ambientBlend);
            const targetZ = THREE.MathUtils.lerp(shapeZ, ambientZ, ambientBlend);

            const micro = (Math.sin(t * 0.37 + i * 0.11) + Math.cos(t * 0.29 + i * 0.07)) * 0.0038;

            positions[i3] += (targetX - positions[i3]) * attraction + micro;
            positions[i3 + 1] += (targetY - positions[i3 + 1]) * attraction + micro * 0.8;
            positions[i3 + 2] += (targetZ - positions[i3 + 2]) * attraction + micro * 0.6;

            if (ambientBlend < 0.5 && assemblyFactor < 0.22) {
                positions[i3] += (targets.random[i3] - positions[i3]) * (baseLerp * 0.55);
                positions[i3 + 1] += (targets.random[i3 + 1] - positions[i3 + 1]) * (baseLerp * 0.55);
                positions[i3 + 2] += (targets.random[i3 + 2] - positions[i3 + 2]) * (baseLerp * 0.55);
            }
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;

        if (materialRef.current) {
            const mixToAmbient = ambientBlend * 0.82;
            const mixedR = sectionColor.r + (colors.ambient.r - sectionColor.r) * mixToAmbient;
            const mixedG = sectionColor.g + (colors.ambient.g - sectionColor.g) * mixToAmbient;
            const mixedB = sectionColor.b + (colors.ambient.b - sectionColor.b) * mixToAmbient;

            materialRef.current.color.r += (mixedR - materialRef.current.color.r) * 0.05;
            materialRef.current.color.g += (mixedG - materialRef.current.color.g) * 0.05;
            materialRef.current.color.b += (mixedB - materialRef.current.color.b) * 0.05;
        }

        const shapeRotation = (scrollProgress - 0.5) * Math.PI * 0.36;
        const ambientRotation = Math.sin(t * 0.08) * 0.08;
        const targetRotation = THREE.MathUtils.lerp(shapeRotation, ambientRotation, ambientBlend);

        pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, targetRotation, 0.015);
        pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, ambientBlend * 0.08, 0.01);
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particleCount}
                    array={targets.random}
                    itemSize={3}
                />
            </bufferGeometry>
            <PointMaterial
                ref={materialRef}
                size={isMobileViewport ? 0.11 : 0.13}
                color="#dff2ff"
                transparent
                opacity={0.95}
                sizeAttenuation
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
            />
        </points>
    );
};

export default ParticleMorph;
