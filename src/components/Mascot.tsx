// Kawaii mascot — emoji + CSS art, zero image dependency

interface MascotProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

const SIZE_MAP = { sm: 'text-3xl', md: 'text-5xl', lg: 'text-7xl' };
const WRAPPER_SIZE = { sm: 'w-12 h-12', md: 'w-20 h-20', lg: 'w-28 h-28' };

export function Mascot({ size = 'md', animate = true, className = '' }: MascotProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${WRAPPER_SIZE[size]} ${className}`}
      role="img"
      aria-label="StickerForge mascot - cute cat character"
    >
      {/* Glow ring */}
      <div
        className="absolute inset-0 rounded-full opacity-40"
        style={{
          background: 'radial-gradient(circle, #C9B8FF 0%, transparent 70%)',
        }}
      />
      {/* Sparkles */}
      <span
        className="absolute -top-1 -right-1 text-xs select-none"
        aria-hidden="true"
      >
        ✨
      </span>
      <span
        className="absolute -bottom-1 -left-1 text-xs select-none"
        aria-hidden="true"
      >
        💫
      </span>
      {/* Main emoji */}
      <span
        className={`${SIZE_MAP[size]} select-none ${animate ? 'animate-float' : ''}`}
        aria-hidden="true"
      >
        🐱
      </span>
    </div>
  );
}
