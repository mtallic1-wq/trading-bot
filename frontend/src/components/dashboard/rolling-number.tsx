import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface RollingNumberProps {
  value: number | string;
  className?: string;
}

export default function RollingNumber({ value, className = "" }: RollingNumberProps) {
  const [digits, setDigits] = useState<string[]>([]);

  useEffect(() => {
    setDigits(value.toString().split(""));
  }, [value]);

  return (
    <span className={`inline-flex overflow-hidden h-6 leading-6 select-none font-mono ${className}`}>
      {digits.map((char, idx) => {
        const isDigit = !isNaN(parseInt(char, 10));

        if (!isDigit) {
          return (
            <span key={idx} className="inline-block">
              {char}
            </span>
          );
        }

        const digitVal = parseInt(char, 10);

        return (
          <span key={idx} className="relative w-[0.6em] h-6 inline-block overflow-hidden">
            <motion.span
              initial={{ y: 0 }}
              animate={{ y: -digitVal * 24 }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
              className="absolute left-0 top-0 flex flex-col"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <span key={n} className="h-6 flex items-center justify-center">
                  {n}
                </span>
              ))}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}
