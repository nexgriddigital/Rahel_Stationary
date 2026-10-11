import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number | string;
  showGlow?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 40,
  showGlow = false
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {showGlow && (
        <div className="absolute inset-0 rounded-2xl bg-[#d4af37]/20 blur-md pointer-events-none" />
      )}
      <img
        src="./favicon.svg"
        alt="Rahel Stationary Logo"
        width={typeof size === 'number' ? size : undefined}
        height={typeof size === 'number' ? size : undefined}
        className="w-full h-full object-contain relative z-10 drop-shadow-md select-none"
        draggable={false}
      />
    </div>
  );
};
