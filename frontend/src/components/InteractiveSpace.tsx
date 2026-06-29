import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleFieldProps {
  bias: string;
}

function ParticleField({ bias }: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 1200;

  // Generate initial particle positions
  const [positions, initialPositions] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const initPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = (Math.random() - 0.5) * 12;
      const z = (Math.random() - 0.5) * 8;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      initPos[i * 3] = x;
      initPos[i * 3 + 1] = y;
      initPos[i * 3 + 2] = z;
    }
    return [pos, initPos];
  }, []);

  // Update color based on trading bot prediction bias
  const color = useMemo(() => {
    const u = (bias || "").toUpperCase();
    if (u.includes("BUY") || u.includes("BULL")) {
      return new THREE.Color("#10b981"); // emerald green
    }
    if (u.includes("SELL") || u.includes("BEAR")) {
      return new THREE.Color("#f43f5e"); // crimson rose
    }
    return new THREE.Color("#06b6d4"); // neon cyan
  }, [bias]);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const time = state.clock.getElapsedTime();
    const pointer = state.pointer; // Normalized coordinates (-1 to 1)

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const array = posAttr.array as Float32Array;

    const u = (bias || "").toUpperCase();
    const isBull = u.includes("BUY") || u.includes("BULL");
    const isBear = u.includes("SELL") || u.includes("BEAR");

    let baseSpeed = 0.04;
    if (isBull || isBear) {
      baseSpeed = 0.12;
    }

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const initX = initialPositions[idx];
      const initY = initialPositions[idx + 1];

      // Animating the particles based on bias
      if (isBull) {
        // Drifts upwards
        array[idx + 1] += baseSpeed * 0.08;
        if (array[idx + 1] > 6) {
          array[idx + 1] = -6; // reset at bottom
        }
      } else if (isBear) {
        // Drifts downwards
        array[idx + 1] -= baseSpeed * 0.08;
        if (array[idx + 1] < -6) {
          array[idx + 1] = 6; // reset at top
        }
      } else {
        // Slow orbital / sideways oscillation
        array[idx] += baseSpeed * 0.015 * Math.sin(time + initY * 0.4);
        array[idx + 1] += baseSpeed * 0.01 * Math.cos(time + initX * 0.4);
      }

      // Gentle wave animation overlay
      array[idx] += Math.sin(time * 0.8 + array[idx + 1] * 0.5) * 0.0015;

      // Mouse influence (cursor pushes particles away, creating waves)
      const mouseX = pointer.x * 7;
      const mouseY = pointer.y * 5;

      const dx = array[idx] - mouseX;
      const dy = array[idx + 1] - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1.8) {
        const repulsionForce = (1.8 - dist) * 0.022;
        array[idx] += dx * repulsionForce;
        array[idx + 1] += dy * repulsionForce;
      }
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.065}
        transparent
        opacity={0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

interface InteractiveSpaceProps {
  bias: string;
}

export default function InteractiveSpace({ bias }: InteractiveSpaceProps) {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none block z-0 opacity-45 bg-slate-950/10">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <ParticleField bias={bias} />
      </Canvas>
    </div>
  );
}
