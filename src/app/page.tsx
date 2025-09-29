'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const morphTargetsParam = [
  'ARKit',
  'Oculus Visemes',
  'mouthOpen',
  'mouthSmile',
  'eyesClosed',
  'eyesLookUp',
  'eyesLookDown',
].join(',');

const rpmAvatarId = '68cd641f4a92a6c566e6401f';
const avatarUrl = `https://models.readyplayer.me/${rpmAvatarId}.glb?morphTargets=${encodeURIComponent(
  morphTargetsParam,
)}&textureSizeLimit=1024&textureFormat=png`;

const AUDIO_URL = '/audio.mp3';
const ENV_MAP_URL = '/environment.exr';

function Avatar({
  url,
  audioAnalyser,
}: {
  url: string;
  audioAnalyser: AnalyserNode | null;
}) {
  // useGLTF returns GLTF & ObjectMap, where scene is a THREE.Group
  const { scene } = useGLTF(url);

  // Find the first mesh with morph targets
  const morphMesh = useMemo<THREE.Mesh | null>(() => {
    let found: THREE.Mesh | null = null;

    scene.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        Array.isArray(child.morphTargetInfluences) &&
        child.morphTargetDictionary
      ) {
        found = child;
      }
    });

    return found;
  }, [scene]);

  const morphDict = morphMesh?.morphTargetDictionary as
    | Record<string, number>
    | undefined;

  const lerp = (start: number, end: number, t: number) => start + (end - start) * t;
  const smoothInfluences = useRef<Record<string, number>>({});

  useFrame(() => {
    if (!morphMesh || !audioAnalyser || !morphDict) return;

    const freqData = new Uint8Array(audioAnalyser.frequencyBinCount);
    audioAnalyser.getByteFrequencyData(freqData);

    let mouthLevel = 0;
    let count = 0;
    for (let i = 5; i <= 50; i++) {
      mouthLevel += freqData[i];
      count++;
    }
    mouthLevel = mouthLevel / count / 255;

    const smileLevel = 0.15 + 0.1 * Math.sin(Date.now() / 1000);
    const eyesClosedLevel = 0.1 + 0.1 * Math.sin(Date.now() / 1500 + 1);

    const targets = {
      mouthOpen: mouthLevel,
      mouthSmile: smileLevel,
      eyesClosed: eyesClosedLevel,
      eyesLookUp: 0,
      eyesLookDown: 0,
    };

    Object.entries(targets).forEach(([name, targetValue]) => {
      const idx = morphDict[name];
      if (idx === undefined || !morphMesh.morphTargetInfluences) return;

      const prev = smoothInfluences.current[name] ?? 0;
      const next = lerp(prev, targetValue, 0.15);
      smoothInfluences.current[name] = next;

      morphMesh.morphTargetInfluences[idx] = next;
    });

    // Fake viseme cycling (optional)
    const visemes = ['viseme_aa', 'viseme_E', 'viseme_I', 'viseme_O', 'viseme_U'];
    visemes.forEach((v) => {
      const idx = morphDict[v];
      if (idx !== undefined && morphMesh.morphTargetInfluences) {
        morphMesh.morphTargetInfluences[idx] = 0;
      }
    });

    const visemeIndex = Math.floor((Date.now() / 1000) % visemes.length);
    const activeViseme = visemes[visemeIndex];
    const activeIdx = morphDict[activeViseme];
    if (
      activeIdx !== undefined &&
      morphMesh.morphTargetInfluences &&
      mouthLevel > 0.01
    ) {
      morphMesh.morphTargetInfluences[activeIdx] = mouthLevel * 1.2;
    }
  });

  return <primitive object={scene} />;
}

function AudioAnalyser({
  onAnalyserReady,
}: {
  onAnalyserReady: (analyser: AnalyserNode) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    const context = new AudioContext();
    const source = context.createMediaElementSource(audio);
    const analyser = context.createAnalyser();

    analyser.fftSize = 2048;
    source.connect(analyser);
    analyser.connect(context.destination);

    onAnalyserReady(analyser);

    audio.play().catch(() => {
      console.warn('Autoplay prevented, user interaction required.');
    });

    return () => {
      analyser.disconnect();
      source.disconnect();
      context.close();
    };
  }, [onAnalyserReady]);

  return <audio ref={audioRef} src={AUDIO_URL} preload="auto" />;
}

export default function Page() {
  const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null);

  return (
    <>
      <AudioAnalyser onAnalyserReady={setAudioAnalyser} />
      <Canvas shadows camera={{ position: [0, 1.4, 2.5], fov: 40 }}>
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          intensity={0.8}
          position={[5, 10, 7]}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <React.Suspense fallback={null}>
          <Avatar url={avatarUrl} audioAnalyser={audioAnalyser} />
          <Environment files={ENV_MAP_URL} background />
        </React.Suspense>
        <OrbitControls
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.9}
          enablePan={false}
          target={[0, 1.4, 0]}
        />
      </Canvas>
    </>
  );
}
