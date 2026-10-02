// frontend/microfrontends/identity/src/components/EnrollNowBrand.tsx
import React from 'react';

export interface EnrollNowBrandProps {
  size?: 'normal' | 'card';
  className?: string;
}

export const EnrollNowBrand: React.FC<EnrollNowBrandProps> = ({
  size = 'normal',
  className = '',
}) => {
  const isCard = size === 'card';
  const iconWidth = isCard ? 36 : 42;
  const iconHeight = isCard ? 32 : 38;
  const fontSize = isCard ? '21px' : '26px';
  const subFontSize = isCard ? '9.5px' : '11px';

  return (
    <div
      className={`enl-brand-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        userSelect: 'none',
      }}
    >
      <svg
        width={iconWidth}
        height={iconHeight}
        viewBox="0 0 44 40"
        fill="none"
        aria-hidden="true"
      >
        {/* Left Figure (Golden Yellow) */}
        <circle cx="15" cy="11" r="7" fill="#F59E0B" />
        <path
          d="M4 36c0-7.18 5.82-13 13-13 3.2 0 6.13 1.16 8.4 3.09-2.2 2.66-3.4 6.15-3.4 9.91H4z"
          fill="#F59E0B"
        />
        {/* Right Figure (Dark Navy) */}
        <circle cx="29" cy="13" r="6.5" fill="#0F172A" />
        <path
          d="M20 36c0-5.8 4.7-10.5 10.5-10.5S41 30.2 41 36H20z"
          fill="#0F172A"
        />
      </svg>
      <div style={{ textAlign: 'left' }}>
        <div
          style={{
            fontSize,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
          }}
        >
          <span style={{ color: '#0F172A' }}>Enroll</span>
          <span style={{ color: '#F59E0B' }}>Now</span>
        </div>
        <div
          style={{
            fontSize: subFontSize,
            fontWeight: 600,
            color: '#64748B',
            letterSpacing: '0.02em',
            marginTop: '2px',
          }}
        >
          Screen. Schedule. Engage.
        </div>
      </div>
    </div>
  );
};
