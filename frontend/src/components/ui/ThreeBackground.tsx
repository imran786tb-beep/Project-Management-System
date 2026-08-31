import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext';

export const ThreeBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup Scene, Fog, Camera, Renderer
    const scene = new THREE.Scene();
    // Use controlled fog density so grid remains clear in light mode
    scene.fog = new THREE.FogExp2(isDarkMode ? 0x090d16 : 0xf1f5f9, isDarkMode ? 0.015 : 0.008);

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 16, 42);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const container = containerRef.current;
    container.appendChild(renderer.domElement);

    // 2. Generate High-Contrast Particle Texture for Light & Dark Modes
    const createParticleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        if (isDarkMode) {
          gradient.addColorStop(0, 'rgba(147, 197, 253, 0.95)');
          gradient.addColorStop(0.4, 'rgba(59, 130, 246, 0.4)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          // Deep blue/slate tone for visible contrast against light backgrounds
          gradient.addColorStop(0, 'rgba(37, 99, 235, 0.85)');
          gradient.addColorStop(0.5, 'rgba(30, 58, 138, 0.35)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(16, 16, 16, 0, Math.PI * 2);
        ctx.fill();
      }
      return new THREE.CanvasTexture(canvas);
    };

    const particleTexture = createParticleTexture();

    // 3. Crisp Corporate Grid Plane (Slate 400 in Light Mode for WCAG contrast)
    const gridHelper = new THREE.GridHelper(
      120,
      40,
      isDarkMode ? 0x3b82f6 : 0x2563eb, // Center line
      isDarkMode ? 0x334155 : 0x94a3b8  // Grid lines: Slate 700 (dark) / Slate 400 (light)
    );
    gridHelper.position.y = -10;
    if (gridHelper.material instanceof THREE.Material) {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = isDarkMode ? 0.35 : 0.45;
    }
    scene.add(gridHelper);

    // 4. Ambient Particle Constellation
    const particleCount = 100;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40 + 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: isDarkMode ? 1.1 : 0.9,
      map: particleTexture,
      transparent: true,
      opacity: isDarkMode ? 0.5 : 0.65,
      // NormalBlending in light mode prevents white additive burnout
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeo, particleMaterial);
    scene.add(particles);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isDarkMode ? 0.9 : 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, isDarkMode ? 0.5 : 0.9);
    mainLight.position.set(20, 30, 20);
    scene.add(mainLight);

    // 6. Mouse Parallax Motion
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 7. Window Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // 8. Animation Loop
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      particles.rotation.y = elapsedTime * 0.015;

      const targetCamX = mouseX * 2.5;
      const targetCamY = 16 - mouseY * 1.5;
      camera.position.x += (targetCamX - camera.position.x) * 0.03;
      camera.position.y += (targetCamY - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      gridHelper.geometry.dispose();
      particleGeo.dispose();
      particleMaterial.dispose();
      particleTexture.dispose();
      renderer.dispose();
    };
  }, [isDarkMode]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-700 opacity-90 dark:opacity-80"
    />
  );
};
