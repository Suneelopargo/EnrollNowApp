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
    <>
      {/* ================================================================= */}
      {/* 1. LEFT REGION: MARKETING CONTENT                                 */}
      {/* ================================================================= */}
      <section className={`enl-marketing-region ${className}`}>
        {/* Brand Logo Header */}
        <EnrollNowBrand size="marketing" className="enl-marketing-brand" />

        {/* Dynamic Marketing Headline & Lead */}
        <MarketingHeadline
          headline={headline}
          description={description}
          className="enl-marketing-headline"
        />

        {/* 4 Feature Highlights (Strictly constrained width) */}
        <FeatureHighlights
          features={features}
          className="enl-marketing-features"
        />
      </section>

      {/* ================================================================= */}
      {/* 2. CENTER REGION: SHOWCASE (RESEARCHER + CARDS + CONNECTOR)       */}
      {/* ================================================================= */}
      <section className="enl-showcase-region">
        <div className="enl-showcase-container">
          {/* Ambient Blobs Behind Photo */}
          <div className="enl-ambient-blob-cyan" />
          <div className="enl-ambient-blob-yellow" />

          {/* Standalone Researcher Photograph */}
          <div className="enl-researcher-frame">
            <img
              src="/assets/login-researcher.png"
              alt="Clinical Researcher smiling at laptop"
              className="enl-researcher-img"
            />
          </div>

          {/* Dotted Flow Connector with Circular Nodes */}
          <svg
            className="enl-flow-connector"
            viewBox="0 0 700 760"
            fill="none"
            aria-hidden="true"
          >
            {/* Dashed Connecting Arc */}
            <path
              d="M 140 220 C 105 250, 92 280, 95 330 C 98 375, 110 415, 145 460"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              fill="none"
            />

            {/* Node 1: Green Circle Ring (Above-left of Card 2) */}
            <circle cx="95" cy="285" r="8.5" fill="#ffffff" stroke="#10b981" strokeWidth="2.8" />
            <circle cx="95" cy="285" r="3.5" fill="#10b981" />

            {/* Node 2: Blue Circle Ring (Below Card 2, Above-left of Card 3) */}
            <circle cx="112" cy="415" r="8.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2.8" />
            <circle cx="112" cy="415" r="3.5" fill="#0284c7" />
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
      </section>
    </>
  );
};

export default LoginMarketingPanel;
