import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

export interface QrCodeRendererProps {
  value: string;
  size?: number; // width & height in pixels (default: 130)
  className?: string;
  displayValue?: boolean;
  label?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  darkColor?: string;
  lightColor?: string;
}

/**
 * High-precision, production-grade QR Code Canvas Renderer.
 * Scannable on all mobile operating systems (iOS, Android), webcams, and 2D hardware imagers.
 */
export const QrCodeRenderer: React.FC<QrCodeRendererProps> = ({
  value,
  size = 130,
  className = '',
  displayValue = true,
  label,
  errorCorrectionLevel = 'M',
  darkColor = '#000000',
  lightColor = '#ffffff'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const cleanValue = (value || '').trim();
    if (!cleanValue) {
      setRenderError('No QR value provided');
      return;
    }

    try {
      QRCode.toCanvas(
        canvasRef.current,
        cleanValue,
        {
          width: size,
          margin: 2, // 2-module quiet zone for high scannability
          errorCorrectionLevel,
          color: {
            dark: darkColor,
            light: lightColor
          }
        },
        (error) => {
          if (error) {
            console.error('QR generation error:', error);
            setRenderError('Failed to generate QR');
          } else {
            setRenderError(null);
          }
        }
      );
    } catch (err) {
      console.error('QR rendering exception:', err);
      setRenderError('QR render error');
    }
  }, [value, size, errorCorrectionLevel, darkColor, lightColor]);

  return (
    <div className={`flex flex-col items-center justify-center p-1.5 bg-white text-black rounded-lg shadow-2xs ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="block max-w-full aspect-square"
      />
      {displayValue && (
        <span className="mt-1 text-[10px] font-mono font-bold tracking-wider text-black max-w-full truncate text-center select-all">
          {label || value}
        </span>
      )}
      {renderError && (
        <span className="text-[9px] text-rose-600 font-sans mt-0.5">{renderError}</span>
      )}
    </div>
  );
};
