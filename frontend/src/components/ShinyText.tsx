interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number; // in seconds
  className?: string;
}

export default function ShinyText({
  text,
  disabled = false,
  speed = 5,
  className = "",
}: ShinyTextProps) {
  if (disabled) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span
      className={`inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-blue-400 bg-[length:200%_auto] ${className}`}
      style={{
        animation: `shimmer ${speed}s linear infinite`,
      }}
    >
      {text}
    </span>
  );
}
