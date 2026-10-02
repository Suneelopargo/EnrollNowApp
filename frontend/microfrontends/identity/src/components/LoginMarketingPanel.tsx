// frontend/microfrontends/identity/src/components/LoginMarketingPanel.tsx
import React from 'react';
import {
  loginContent,
  defaultStatistics,
  StatisticItem,
} from '../data/loginContent';
import { EnrollNowBrand } from './EnrollNowBrand';
import { MarketingHeadline } from './MarketingHeadline';
import { FeatureHighlights } from './FeatureHighlights';
import { FloatingInfoCard } from './FloatingInfoCard';
import { LoginStatistics } from './LoginStatistics';

export interface LoginMarketingPanelProps {
  statistics?: StatisticItem[];
  className?: string;
}

export const LoginMarketingPanel: React.FC<LoginMarketingPanelProps> = ({
  statistics = defaultStatistics,
  className = '',
}) => {
  const { headline, description, features, floatingCards } = loginContent;

  const cardScreening = floatingCards.find((c) => c.id === 'screening')!;
  const cardAppointments = floatingCards.find((c) => c.id === 'appointments')!;
  const cardEngage = floatingCards.find((c) => c.id === 'engage')!;

  return (
    <div className={`enl-marketing-panel ${className}`}>
      {/* ================================================================= */}
      {/* 1. DECORATIVE AMBIENT SHAPES (CSS/SVG)                           */}
      {/* ================================================================= */}

      {/* Ambient Top Glows */}
      <div className="enl-ambient-glow-yellow" />
      <div className="enl-ambient-glow-blue" />

      {/* Top Dot Grid Pattern */}
      <svg
        className="enl-dot-grid-top"
        width="110"
        height="60"
        viewBox="0 0 110 60"
        fill="none"
        aria-hidden="true"
      >
        <pattern
          id="enl-dots-top"
          x="0"
          y="0"
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="3" cy="3" r="1.5" fill="#93C5FD" opacity="0.75" />
        </pattern>
        <rect width="110" height="60" fill="url(#enl-dots-top)" />
      </svg>

      {/* Bottom Dot Grid Pattern */}
      <svg
        className="enl-dot-grid-bottom"
        width="90"
        height="60"
        viewBox="0 0 90 60"
        fill="none"
        aria-hidden="true"
      >
        <pattern
          id="enl-dots-bottom"
          x="0"
          y="0"
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="3" cy="3" r="1.5" fill="#93C5FD" opacity="0.75" />
        </pattern>
        <rect width="90" height="60" fill="url(#enl-dots-bottom)" />
      </svg>

      {/* ================================================================= */}
      {/* 2. LEFT BRAND & MARKETING COPY                                    */}
      {/* ================================================================= */}
      <div className="enl-marketing-content">
        {/* Brand Logo Header */}
        <EnrollNowBrand size="normal" className="enl-marketing-brand" />

        {/* Dynamic Marketing Headline & Lead */}
        <MarketingHeadline
          headline={headline}
          description={description}
          className="enl-marketing-headline"
        />

        {/* 4 Feature Highlight Cards */}
        <FeatureHighlights
          features={features}
          className="enl-marketing-features"
        />
      </div>

      {/* ================================================================= */}
      {/* 3. CENTER CLINICAL SHOWCASE (Doctor Photo & Floating Cards)       */}
      {/* ================================================================= */}
      <div className="enl-showcase-wrapper">
        {/* Researcher Standalone Photograph */}
        <div className="enl-researcher-frame">
          <img
            src="/assets/login-researcher.png"
            alt="Clinical Researcher smiling at laptop"
            className="enl-researcher-img"
          />
        </div>

        {/* Dashed Connecting Flow Path with Circular Nodes */}
        <svg
          className="enl-flow-connector"
          viewBox="0 0 180 340"
          fill="none"
          aria-hidden="true"
        >
          {/* Dashed Connecting Arc */}
          <path
            d="M 125 10 C 20 60, 8 160, 52 240 C 62 265, 72 285, 80 310"
            stroke="#38BDF8"
            strokeWidth="1.8"
            strokeDasharray="4 4"
            fill="none"
          />

          {/* Node 1: Green Circle Ring */}
          <circle cx="36" cy="115" r="7" fill="#ffffff" stroke="#10B981" strokeWidth="2.5" />
          <circle cx="36" cy="115" r="2.5" fill="#10B981" />

          {/* Node 2: Blue Circle Ring */}
          <circle cx="48" cy="225" r="7" fill="#ffffff" stroke="#0284C7" strokeWidth="2.5" />
          <circle cx="48" cy="225" r="2.5" fill="#0284C7" />
        </svg>

        {/* Floating Card 1: Participant Screening */}
        <FloatingInfoCard
          card={cardScreening}
          className="enl-float-card enl-float-screening"
        />

        {/* Floating Card 2: Schedule Appointments */}
        <FloatingInfoCard
          card={cardAppointments}
          className="enl-float-card enl-float-appointments"
        />

        {/* Floating Card 3: Engage Participants */}
        <FloatingInfoCard
          card={cardEngage}
          className="enl-float-card enl-float-engage"
        />
      </div>

      {/* ================================================================= */}
      {/* 4. BOTTOM OCEAN WAVE WITH DYNAMIC STATISTICS                      */}
      {/* ================================================================= */}
      <div className="enl-wave-container">
        <svg
          className="enl-wave-svg"
          viewBox="0 0 1200 180"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            {/* Primary Front Wave Rich Blue Gradient */}
            <linearGradient id="enl-wave-front" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="35%" stopColor="#0369a1" />
              <stop offset="70%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>

            {/* Subtle Back Wave Cyan Gradient */}
            <linearGradient id="enl-wave-back" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {/* Background Soft Cyan Wave */}
          <path
            d="M 0 55 C 220 85, 420 30, 680 75 C 920 115, 1080 60, 1200 120 L 1200 180 L 0 180 Z"
            fill="url(#enl-wave-back)"
          />

          {/* Foreground Deep Royal Blue Wave */}
          <path
            d="M 0 65 C 260 115, 520 40, 780 85 C 980 120, 1100 80, 1200 145 L 1200 180 L 0 180 Z"
            fill="url(#enl-wave-front)"
          />
        </svg>

        {/* Dynamic Statistics Component Inside Wave */}
        <div className="enl-wave-stats-wrapper">
          <LoginStatistics statistics={statistics} />
        </div>
      </div>
    </div>
  );
};
