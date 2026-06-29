import React, { useRef, useState } from "react";

interface TiltedCardProps {
  children: React.ReactNode;
  className?: string;
  maxRotation?: number; // Max degrees of tilt
  scale?: number; // Scale factor on hover
}

export default function TiltedCard({
  children,
  className = "",
  maxRotation = 7,
  scale = 1.015,
}: TiltedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left; // cursor position relative to the element
    const y = e.clientY - rect.top;

    // Convert relative coordinates to values between -0.5 and 0.5
    const normX = x / rect.width - 0.5;
    const normY = y / rect.height - 0.5;

    // Calculate tilt angles (rotate around horizontal axes)
    setRotateX(-normY * maxRotation);
    setRotateY(normX * maxRotation);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`transition-all duration-200 ease-out will-change-transform ${className}`}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)",
      }}
    >
      {children}
    </div>
  );
}
