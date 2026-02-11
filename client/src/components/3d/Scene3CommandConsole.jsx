import { Float, Text } from '@react-three/drei';
import InteractiveDevice from '../InteractiveDevice';

const Scene3CommandConsole = ({ onCollect }) => {
    return (
        <group>
            {/* Abstract Digital Environment */}
            <group position={[0, 0, -10]}>
                {[...Array(20)].map((_, i) => (
                    <mesh key={i} position={[(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10]}>
                        <boxGeometry args={[0.1, 4, 0.1]} />
                        <meshBasicMaterial color="#00e5ff" transparent opacity={0.3} />
                    </mesh>
                ))}
            </group>

            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <Text
                    position={[0, 4, -5]}
                    fontSize={1.5}
                    color="#ff6fff"
                    font="https://fonts.gstatic.com/s/orbitron/v25/y97pyUkyS9mx6W6uyUqCcGIA.woff"
                    anchorX="center"
                    anchorY="middle"
                >
                    COMMAND CONSOLE
                </Text>
            </Float>

            {/* Interactive Code Nodes */}
            <InteractiveDevice
                position={[0, 1, -2]}
                color="#4fc3f7"
                meta={{ id: 'code-1', title: 'Code Node', type: 'programming' }}
                onCollect={onCollect}
            />
            <InteractiveDevice
                position={[-5, -1, -3]}
                color="#00e5ff"
                meta={{ id: 'script-1', title: 'Script', type: 'programming' }}
                onCollect={onCollect}
            />

            <gridHelper args={[50, 50, "#ff6fff", "#050811"]} position={[0, -1.99, 0]} />
        </group>
    );
};

export default Scene3CommandConsole;
