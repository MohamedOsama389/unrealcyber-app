import { Float, Text } from '@react-three/drei';
import InteractiveDevice from '../InteractiveDevice';

const Scene2HomeOffice = ({ onCollect }) => {
    return (
        <group>
            {/* Office Environment - Desk & Screen placeholders */}
            <group position={[0, -1.5, -5]}>
                <mesh position={[0, 0, 0]} receiveShadow>
                    <boxGeometry args={[10, 0.2, 4]} />
                    <meshStandardMaterial color="#1a1a1a" />
                </mesh>
                <mesh position={[0, 1.5, -1.8]}>
                    <boxGeometry args={[6, 3, 0.1]} />
                    <meshStandardMaterial color="#000" emissive="#00e5ff" emissiveIntensity={0.1} />
                </mesh>
            </group>

            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <Text
                    position={[0, 4, -5]}
                    fontSize={1.5}
                    color="#7c5cff"
                    font="https://fonts.gstatic.com/s/orbitron/v25/y97pyUkyS9mx6W6uyUqCcGIA.woff"
                    anchorX="center"
                    anchorY="middle"
                >
                    HOME OFFICE
                </Text>
            </Float>

            {/* Interactive Laptops and Endpoints */}
            <InteractiveDevice
                position={[-2, 0.5, -2]}
                color="#ff6fff"
                meta={{ id: 'laptop-1', title: 'Laptop', type: 'ethics' }}
                onCollect={onCollect}
            />
            <InteractiveDevice
                position={[3, 0.2, -1]}
                color="#4fc3f7"
                meta={{ id: 'tablet-1', title: 'Endpoint', type: 'ethics' }}
                onCollect={onCollect}
            />

            <gridHelper args={[50, 50, "#7c5cff", "#050811"]} position={[0, -1.99, 0]} />
        </group>
    );
};

export default Scene2HomeOffice;
