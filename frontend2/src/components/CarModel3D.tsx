import { useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "motion/react";

interface CarModel3DProps {
  setIsDragging: (value: boolean) => void;
  isLifted: boolean;
}

function Model({ modelPath }: { modelPath: string }) {
  const modelRef = useRef<THREE.Group>(null);

  // Load the GLB model
  const gltf = useGLTF(modelPath);

  useEffect(() => {
    if (modelRef.current && gltf.scene) {
      // Center and scale the model
      const box = new THREE.Box3().setFromObject(modelRef.current);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 5.0 / maxDim; // 2x zoom (was 2.5)
      
      modelRef.current.scale.setScalar(scale);
      modelRef.current.position.x = -center.x * scale;
      modelRef.current.position.y = (-center.y * scale) + 1.0; // Moved up
      modelRef.current.position.z = -center.z * scale;
    }
  }, [gltf, gltf.scene]);

  // Auto-rotation animation
  useFrame((_state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * 0.3;
    }
  });

  return <primitive ref={modelRef} object={gltf.scene} />;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <motion.div
        className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

export function CarModel3D({ setIsDragging, isLifted }: CarModel3DProps) {
  const modelPath = "/models/textured.glb"; // Using textured model

  return (
    <div className="relative w-[800px] h-[500px]">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <Suspense fallback={null}>
          {/* Lighting Setup */}
          <ambientLight intensity={0.6} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.3}
            penumbra={1}
            intensity={1.2}
            castShadow
          />
          <spotLight
            position={[-10, 10, -10]}
            angle={0.3}
            penumbra={1}
            intensity={0.6}
          />
          <pointLight position={[0, 5, 0]} intensity={0.5} color="#ff0000" />
          
          {/* Red rim lights for F1 dramatic effect */}
          <pointLight position={[0, 0, -5]} intensity={1} color="#dc2626" />
          <pointLight position={[5, 0, 0]} intensity={0.5} color="#dc2626" />
          <pointLight position={[-5, 0, 0]} intensity={0.5} color="#dc2626" />

          {/* Environment for reflections */}
          <Environment preset="night" />

          {/* Camera */}
          <PerspectiveCamera makeDefault position={[0, 1.5, 5]} fov={50} />

          {/* 3D Model */}
          <Model modelPath={modelPath} />

          {/* Controls */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={3}
            maxDistance={10}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
            onStart={() => setIsDragging(true)}
            onEnd={() => setIsDragging(false)}
          />
        </Suspense>
      </Canvas>

      {/* Loading Overlay */}
      <motion.div
        className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <LoadingSpinner />
      </motion.div>

      {/* Glowing Accents */}
      {isLifted && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Front Lights */}
          <div className="absolute top-1/2 left-[15%] w-4 h-4 bg-red-500 rounded-full blur-md" />
          <div className="absolute top-1/2 right-[15%] w-4 h-4 bg-red-500 rounded-full blur-md" />
        </motion.div>
      )}
    </div>
  );
}
