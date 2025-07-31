import React from 'react';
import stormyAvatarImage from '@assets/ChatGPT Image Jul 31, 2025, 03_42_36 PM_1753998186905.png';

interface StormyAvatarProps {
  size?: number;
  className?: string;
}

export function StormyAvatar({ size = 32, className = "" }: StormyAvatarProps) {
  return (
    <div 
      className={`relative inline-block rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={stormyAvatarImage}
        alt="Stormy - AI Assistant"
        width={size}
        height={size}
        className="w-full h-full object-cover"
      />
    </div>
  );
}