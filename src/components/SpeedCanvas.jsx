import { useEffect, useRef } from 'react';

export default function SpeedCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const STREAK_COUNT = 32;
    const SPARK_COUNT = 25;

    class SpeedStreak {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = init ? Math.random() * (width + 400) : width + Math.random() * 200;
        this.y = Math.random() * height;
        this.length = Math.random() * 140 + 60;
        this.speed = Math.random() * 4 + 3.5;
        this.angle = -0.42; // ~-24 deg matching reference momentum
        this.thickness = Math.random() * 2 + 0.8;
        this.opacity = Math.random() * 0.45 + 0.15;
        this.hue = Math.random() > 0.4 ? 275 : 300; // Violet to Magenta
      }

      update() {
        this.x -= Math.cos(this.angle) * this.speed * 2.2;
        this.y -= Math.sin(this.angle) * this.speed * 2.2;

        if (this.x < -200 || this.y > height + 200 || this.y < -200) {
          this.reset();
        }
      }

      draw() {
        const headX = this.x;
        const headY = this.y;
        const tailX = this.x - Math.cos(this.angle) * this.length;
        const tailY = this.y - Math.sin(this.angle) * this.length;

        const grad = ctx.createLinearGradient(headX, headY, tailX, tailY);
        grad.addColorStop(0, `hsla(${this.hue}, 95%, 75%, ${this.opacity})`);
        grad.addColorStop(0.3, `hsla(${this.hue}, 90%, 65%, ${this.opacity * 0.7})`);
        grad.addColorStop(1, `hsla(${this.hue}, 80%, 50%, 0)`);

        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = this.thickness;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }

    class Spark {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : height + 10;
        this.radius = Math.random() * 1.5 + 0.5;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = -(Math.random() * 1.2 + 0.4);
        this.alpha = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha += Math.sin(Date.now() * 0.003) * 0.01;

        if (this.y < -20) {
          this.reset();
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(217, 70, 239, ${Math.max(0.1, this.alpha)})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#a855f7';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const streaks = Array.from({ length: STREAK_COUNT }, () => new SpeedStreak());
    const sparks = Array.from({ length: SPARK_COUNT }, () => new Spark());

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      streaks.forEach((streak) => {
        streak.update();
        streak.draw();
      });

      sparks.forEach((spark) => {
        spark.update();
        spark.draw();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} id="fx-canvas" aria-hidden="true" />;
}
