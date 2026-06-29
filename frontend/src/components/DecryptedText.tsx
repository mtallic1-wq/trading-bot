import { useEffect, useState } from "react";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  className?: string;
  sequential?: boolean;
  revealDelay?: number;
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*()_+-=[]{}|;:,.<>?";

export default function DecryptedText({
  text,
  speed = 40,
  maxIterations = 10,
  className = "",
  sequential = true,
  revealDelay = 0,
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let active = true;
    let timer: any;

    const startAnimation = () => {
      const targetLength = text.length;
      let iterations = Array(targetLength).fill(0);
      let revealed = Array(targetLength).fill(false);

      const step = () => {
        if (!active) return;

        let complete = true;
        const current = text.split("").map((char, index) => {
          if (char === " ") return " ";
          
          if (revealed[index]) return char;

          complete = false;

          // If sequential, only reveal the next character if the previous ones are revealed
          const canReveal = !sequential || index === 0 || revealed[index - 1];

          if (canReveal && iterations[index] >= maxIterations) {
            revealed[index] = true;
            return char;
          }

          iterations[index]++;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        });

        setDisplayText(current.join(""));

        if (!complete) {
          timer = setTimeout(step, speed);
        }
      };

      timer = setTimeout(step, revealDelay);
    };

    startAnimation();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [text, speed, maxIterations, sequential, revealDelay, isHovered]);

  return (
    <span 
      className={className}
      onMouseEnter={() => setIsHovered(prev => !prev)}
      style={{ display: "inline-block" }}
    >
      {displayText || text}
    </span>
  );
}
