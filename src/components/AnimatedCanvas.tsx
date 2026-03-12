import { useEffect, useRef } from 'react';

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

interface AnimatedCanvasProps {
  particles: Particle[];
}

export function AnimatedCanvas({ particles }: AnimatedCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    const drawVectorLines = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate pixel coordinates for particles
      const pixelParticles = particles.map(p => ({
        ...p,
        px: (p.x / 100) * canvas.width,
        py: (p.y / 100) * canvas.height,
      }));

      // Draw connections between nearby particles
      for (let i = 0; i < pixelParticles.length; i++) {
        for (let j = i + 1; j < pixelParticles.length; j++) {
          const dx = pixelParticles[i].px - pixelParticles[j].px;
          const dy = pixelParticles[i].py - pixelParticles[j].py;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            const opacity = 1 - distance / 150;
            ctx.strokeStyle = `rgba(168, 85, 247, ${opacity * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pixelParticles[i].px, pixelParticles[i].py);
            ctx.lineTo(pixelParticles[j].px, pixelParticles[j].py);
            ctx.stroke();
          }
        }
      }

      // Draw particles with glow
      pixelParticles.forEach(p => {
        // Glow
        const gradient = ctx.createRadialGradient(p.px, p.py, 0, p.px, p.py, p.size * 8);
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
        gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(p.px - p.size * 8, p.py - p.size * 8, p.size * 16, p.size * 16);

        // Core particle
        ctx.fillStyle = `rgba(168, 85, 247, 0.8)`;
        ctx.beginPath();
        ctx.arc(p.px, p.py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    let animationId: number;
    const animate = () => {
      drawVectorLines();
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', setCanvasSize);
    };
  }, [particles]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 opacity-60"
    />
  );
}
