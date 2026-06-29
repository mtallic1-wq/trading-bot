import { useEffect, useRef } from "react";

interface SquaresProps {
  direction?: "diagonal" | "up" | "down" | "left" | "right";
  speed?: number; // 0.1 to 2
  borderColor?: string;
  squareSize?: number;
  hoverIntensity?: number;
}

export default function Squares({
  direction = "diagonal",
  speed = 0.5,
  borderColor = "rgba(30, 41, 59, 0.4)",
  squareSize = 48,
  hoverIntensity = 1.5,
}: SquaresProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = canvas.width = entry.contentRect.width;
        height = canvas.height = entry.contentRect.height;
      }
    });
    resizeObserver.observe(canvas);

    // Keep track of active fading squares
    interface Square {
      x: number;
      y: number;
      opacity: number;
      targetOpacity: number;
      fadeSpeed: number;
    }
    const activeSquares: Map<string, Square> = new Map();

    let offset = { x: 0, y: 0 };
    
    // Mouse hover tracking
    let mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Apply offset for grid movement animation
      switch (direction) {
        case "diagonal":
          offset.x = (offset.x - speed) % squareSize;
          offset.y = (offset.y - speed) % squareSize;
          break;
        case "up":
          offset.y = (offset.y - speed) % squareSize;
          break;
        case "down":
          offset.y = (offset.y + speed) % squareSize;
          break;
        case "left":
          offset.x = (offset.x - speed) % squareSize;
          break;
        case "right":
          offset.x = (offset.x + speed) % squareSize;
          break;
      }

      const cols = Math.ceil(width / squareSize) + 2;
      const rows = Math.ceil(height / squareSize) + 2;

      const gridStartX = (offset.x % squareSize) - squareSize;
      const gridStartY = (offset.y % squareSize) - squareSize;

      // Draw grid lines
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;

      // Vertical lines
      for (let i = 0; i <= cols; i++) {
        const x = gridStartX + i * squareSize;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let j = 0; j <= rows; j++) {
        const y = gridStartY + j * squareSize;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Generate random highlights
      if (Math.random() < 0.04) {
        const randCol = Math.floor(Math.random() * cols);
        const randRow = Math.floor(Math.random() * rows);
        const key = `${randCol}-${randRow}`;

        if (!activeSquares.has(key)) {
          activeSquares.set(key, {
            x: gridStartX + randCol * squareSize,
            y: gridStartY + randRow * squareSize,
            opacity: 0,
            targetOpacity: Math.random() * 0.15 + 0.05,
            fadeSpeed: Math.random() * 0.005 + 0.002,
          });
        }
      }

      // Render & Update fading squares
      for (const [key, sq] of activeSquares.entries()) {
        // Recalculate position relative to current offset grid coords
        const colIdx = parseInt(key.split("-")[0]);
        const rowIdx = parseInt(key.split("-")[1]);
        const currX = gridStartX + colIdx * squareSize;
        const currY = gridStartY + rowIdx * squareSize;

        if (sq.opacity < sq.targetOpacity) {
          sq.opacity += sq.fadeSpeed;
        } else {
          sq.opacity -= sq.fadeSpeed;
        }

        if (sq.opacity <= 0) {
          activeSquares.delete(key);
          continue;
        }

        ctx.fillStyle = `rgba(59, 130, 246, ${sq.opacity})`;
        ctx.fillRect(currX + 1, currY + 1, squareSize - 2, squareSize - 2);
      }

      // Mouse interactive highlight
      if (mouse.x > 0 && mouse.y > 0) {
        const col = Math.floor((mouse.x - gridStartX) / squareSize);
        const row = Math.floor((mouse.y - gridStartY) / squareSize);
        const hoverX = gridStartX + col * squareSize;
        const hoverY = gridStartY + row * squareSize;

        ctx.fillStyle = `rgba(59, 130, 246, ${0.08 * hoverIntensity})`;
        ctx.fillRect(hoverX + 1, hoverY + 1, squareSize - 2, squareSize - 2);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [direction, speed, borderColor, squareSize, hoverIntensity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none block z-0 opacity-40"
    />
  );
}
