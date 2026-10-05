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
            {/* Dashed Connecting Path - Upper Segment: Card 1 (Screening) -> Node 1 -> Card 2 (Appointments) */}
            <path
              d="M 80 182 C 48 196, 20 212, 22 230 C 24 250, 36 270, 45 285"
              stroke="#0284c7"
              strokeWidth="2.8"
              strokeDasharray="6 5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Node 1: Green Ring (Upper Node between Card 1 and Card 2) */}
            <circle cx="22" cy="230" r="9" fill="#ffffff" stroke="#10b981" strokeWidth="3.2" />

            {/* Dashed Connecting Path - Lower Segment: Card 2 (Appointments) -> Node 2 -> Card 3 (Engage) */}
            <path
              d="M 45 379 C 38 395, 30 405, 32 418 C 35 432, 55 442, 80 450"
              stroke="#0284c7"
              strokeWidth="2.8"
              strokeDasharray="6 5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Node 2: Blue Ring (Lower Node between Card 2 and Card 3) */}
            <circle cx="32" cy="418" r="9" fill="#ffffff" stroke="#0284c7" strokeWidth="3.2" />
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
