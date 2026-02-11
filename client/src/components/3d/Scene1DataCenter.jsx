import { Float, Text } from '@react-three/drei';
import InteractiveDevice from '../InteractiveDevice';

const Scene1DataCenter = ({ onCollect }) => {
    return (
        <group>
            {/* Background Server Racks - stylized boxes */}
            <group position={[0, -2, -10]}>
                {[...Array(5)].map((_, i) => (
                    <mesh key={i} position={[(i - 2) * 5, 2, -2]}>
                        <boxGeometry args={[4, 8, 1]} />
                        <meshStandardMaterial color="#0c1324" metalness={0.8} roughness={0.2} />
                        {/* Glowing rack lights */}
                        {[...Array(10)].map((_, j) => (
                            <mesh key={j} position={[1.8, (j - 5) * 0.7, 0.51]}>
                                <planeGeometry args={[0.2, 0.1]} />
                                <meshBasicMaterial color={Math.random() > 0.5 ? "#00e5ff" : "#7c5cff"} />
                            </mesh>
                        ))}
                    </mesh>
                ))}
            </group>

            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <Text
                    position={[0, 4, -5]}
                    fontSize={1.5}
                    color="#00e5ff"
                    font="https://fonts.gstatic.com/s/orbitron/v25/y97pyUkyS9mx6W6uyUqCcGIA.woff"
                    anchorX="center"
                    anchorY="middle"
                >
                    DATA CENTER
                </Text>
            </Float>

            {/* Interactive Routers and Switches */}
            <InteractiveDevice
                position={[-4, 0, 0]}
                color="#00e5ff"
                meta={{ id: 'router-1', title: 'Router', type: 'network' }}
                onCollect={onCollect}
            />
            <InteractiveDevice
                position={[4, 1, -2]}
                color="#7c5cff"
                meta={{ id: 'switch-1', title: 'Switch', type: 'network' }}
                onCollect={onCollect}
            />

            <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color="#050811" transparent opacity={0.8} />
            </mesh>
            <gridHelper args={[50, 50, "#00e5ff", "#0c1324"]} position={[0, -1.99, 0]} />
        </group>
    );
};

export default Scene1DataCenter;
