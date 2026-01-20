import React from 'react';
import { cn } from '@/lib/utils/tailwind-helpers';

interface VynkLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const VynkLogo = ({ className, ...props }: VynkLogoProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={cn("w-full h-full", className)}
      {...props}
    >
      <defs>
        {/* === LIGHT MODE DEFINITIONS === */}
        <linearGradient id="light-glass-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#a78bfa', stopOpacity: 0.8 }} /> {/* violet-400 */}
          <stop offset="50%" style={{ stopColor: '#2dd4bf', stopOpacity: 0.6 }} /> {/* teal-400 */}
          <stop offset="100%" style={{ stopColor: '#60a5fa', stopOpacity: 0.8 }} /> {/* blue-400 */}
        </linearGradient>

        <filter id="light-mica-filter">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
          {/* Subtle noise for Frosted Glass effect */}
           <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" result="noise"/>
           <feComposite in="noise" in2="SourceGraphic" operator="in" result="texturedNoise"/>
           <feBlend in="texturedNoise" in2="SourceGraphic" mode="overlay" opacity="0.1"/>
        </filter>

        {/* === DARK MODE DEFINITIONS === */}
        <linearGradient id="dark-glass-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#7c3aed', stopOpacity: 0.9 }} /> {/* violet-600 */}
          <stop offset="50%" style={{ stopColor: '#0d9488', stopOpacity: 0.8 }} /> {/* teal-600 */}
          <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 0.9 }} /> {/* blue-600 */}
        </linearGradient>

        <filter id="dark-mica-filter">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
           <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" result="noise"/>
           <feComposite in="noise" in2="SourceGraphic" operator="in" result="texturedNoise"/>
           <feBlend in="texturedNoise" in2="SourceGraphic" mode="overlay" opacity="0.15"/>
        </filter>

        {/* === PATHS === */}
        {/* The "V" Shape container */}
        <path id="vynk-v-shape" d="M 40 40 C 40 20 64 20 64 40 L 112 180 C 116 195 140 195 144 180 L 192 40 C 192 20 216 20 216 40 L 216 60 C 216 80 192 80 192 60 L 158 160 L 150 60 C 150 45 130 40 120 50 L 128 160 L 94 60 C 94 80 70 80 70 60 Z" />

        {/* Re-designed V: A smooth fluid V shape */}
        <path id="fluid-v" d="M 52.3 43.4 C 36.8 43.4 26.6 59.8 33.5 73.8 L 105.1 216.9 C 114.3 235.3 141.7 235.3 150.9 216.9 L 222.5 73.8 C 229.4 59.8 219.2 43.4 203.7 43.4 L 180 43.4 C 170 43.4 161.4 50.5 159.2 60.3 L 140 146 L 120.8 60.3 C 118.6 50.5 110 43.4 100 43.4 L 52.3 43.4 Z" />

        {/* The Integrated Chat Bubble (Negative Space or Overlay) */}
        {/* A bubble nestled in the 'crotch' of the V */}
        <path id="nestled-bubble" d="M 128 85 C 112.5 85 100 95 100 107 C 100 119 112.5 129 128 129 C 131 129 135 128 138 127 L 148 133 L 145 123 C 151 119 156 114 156 107 C 156 95 143.5 85 128 85 Z" />

        {/* Combined Shape: The V with a bubble cutout effect */}
         <clipPath id="bubble-clip">
            <use href="#nestled-bubble" />
         </clipPath>
      </defs>

      {/* === LIGHT MODE RENDERING === */}
      <g className="dark:hidden">
        {/* Background V with Mica Glass Effect */}
        <use href="#fluid-v" fill="url(#light-glass-gradient)" filter="url(#light-mica-filter)" />
         {/* The Bubble inside - White/Clear to look like a cutout or a glowing core */}
        <use href="#nestled-bubble" fill="white" opacity="0.9" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
      </g>

      {/* === DARK MODE RENDERING === */}
      <g className="hidden dark:block">
        {/* Background V with Mica Glass Effect */}
        <use href="#fluid-v" fill="url(#dark-glass-gradient)" filter="url(#dark-mica-filter)" />
        {/* The Bubble inside - White/Clear to look like a cutout or a glowing core */}
        <use href="#nestled-bubble" fill="white" opacity="0.95" filter="drop-shadow(0 2px 8px rgba(255,255,255,0.2))" />
      </g>
    </svg>
  );
};
