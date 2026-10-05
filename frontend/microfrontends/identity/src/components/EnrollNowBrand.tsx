// frontend/microfrontends/identity/src/components/EnrollNowBrand.tsx
import React from 'react';

export interface EnrollNowBrandProps {
  size?: 'normal' | 'card' | 'marketing';
  className?: string;
}

export const EnrollNowBrand: React.FC<EnrollNowBrandProps> = ({
  size = 'normal',
  className = '',
}) => {
  const isMarketing = size === 'marketing';
  const isCard = size === 'card';

  return (
    <div
      className={`enl-brand-container ${isMarketing ? 'enl-brand-marketing' : isCard ? 'enl-brand-card' : 'enl-brand-normal'} ${className}`}
    >
      <svg
        className="enl-brand-svg"
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
      <div className="enl-brand-text-col">
        <div className="enl-brand-name">
          <span className="enl-brand-part-enroll">Enroll</span>
          <span className="enl-brand-part-now">Now</span>
        </div>
        <div className="enl-brand-tagline">
          Screen. Schedule. Engage.
        </div>
      </div>
    </div>
  );
};

export default EnrollNowBrand;
