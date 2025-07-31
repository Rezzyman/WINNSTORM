import React from 'react';

interface StormyAvatarProps {
  size?: number;
  className?: string;
}

export function StormyAvatar({ size = 32, className = "" }: StormyAvatarProps) {
  return (
    <div 
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Circle */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="url(#stormyGradient)"
          stroke="currentColor"
          strokeWidth="2"
        />
        
        {/* Cowboy Hat */}
        <ellipse
          cx="50"
          cy="25"
          rx="35"
          ry="8"
          fill="#8B4513"
          stroke="#654321"
          strokeWidth="1"
        />
        <ellipse
          cx="50"
          cy="35"
          rx="18"
          ry="25"
          fill="#A0522D"
          stroke="#654321"
          strokeWidth="1"
        />
        <ellipse
          cx="50"
          cy="32"
          rx="16"
          ry="3"
          fill="#654321"
        />
        
        {/* Hat Band */}
        <rect
          x="34"
          y="30"
          width="32"
          height="4"
          rx="2"
          fill="#2D4A87"
        />
        
        {/* Face */}
        <circle
          cx="50"
          cy="60"
          r="20"
          fill="#E6B887"
          stroke="#D4A574"
          strokeWidth="1"
        />
        
        {/* Eyes */}
        <circle cx="44" cy="55" r="2" fill="#2D4A87" />
        <circle cx="56" cy="55" r="2" fill="#2D4A87" />
        <circle cx="44.5" cy="54.5" r="0.8" fill="#87CEEB" />
        <circle cx="56.5" cy="54.5" r="0.8" fill="#87CEEB" />
        
        {/* Nose */}
        <ellipse cx="50" cy="60" rx="1.5" ry="2" fill="#D4A574" />
        
        {/* Mouth - Friendly smile */}
        <path
          d="M 45 65 Q 50 68 55 65"
          stroke="#654321"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Lightning bolt accent (Storm theme) */}
        <path
          d="M 65 15 L 62 25 L 67 25 L 63 35 L 68 25 L 65 25 Z"
          fill="#FFD700"
          stroke="#FFA500"
          strokeWidth="0.5"
        />
        
        {/* Small cloud accent */}
        <g transform="translate(20, 15)">
          <circle cx="8" cy="5" r="3" fill="#87CEEB" opacity="0.7" />
          <circle cx="12" cy="5" r="4" fill="#87CEEB" opacity="0.7" />
          <circle cx="16" cy="5" r="3" fill="#87CEEB" opacity="0.7" />
        </g>
        
        <defs>
          <linearGradient id="stormyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2D4A87" />
            <stop offset="50%" stopColor="#4A90E2" />
            <stop offset="100%" stopColor="#87CEEB" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}