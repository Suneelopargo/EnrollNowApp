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

          {/* Precision Flow Connector SVG Linking Stage 1 -> Node 1 -> Stage 2 -> Node 2 -> Stage 3 */}
          <svg
            className="enl-flow-connector"
            viewBox="0 0 420 600"
            fill="none"
            aria-hidden="true"
          >
            {/* Upper Flow Line: Card 1 (Screening) -> Node 1 -> Card 2 (Appointments) */}
            <path
              d="M 130 160 C 70 165, 35 175, 35 195 C 35 210, 20 215, 20 230"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              strokeLinecap="round"
              fill="none"
            />
            {/* Anchor dot on Card 1 bottom-left */}
            <circle cx="130" cy="160" r="3.5" fill="#0284c7" />

            {/* Node 1: Stage 1 Completed Milestone (35, 195) */}
            <g transform="translate(35, 195)">
              <circle r="14" fill="rgba(16, 185, 129, 0.15)" />
              <circle r="10" fill="#ffffff" stroke="#10b981" strokeWidth="2.4" />
              <path
                d="M -3.2 0 L -0.8 2.4 L 3.5 -2.2"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* Anchor dot on Card 2 top-left */}
            <circle cx="20" cy="230" r="3.5" fill="#10b981" />

            {/* Lower Flow Line: Card 2 (Appointments) -> Node 2 -> Card 3 (Engage) */}
            <path
              d="M 20 335 C 20 355, 35 365, 35 385 C 35 410, 70 430, 130 435"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              strokeLinecap="round"
              fill="none"
            />
            {/* Anchor dot on Card 2 bottom-left */}
            <circle cx="20" cy="335" r="3.5" fill="#0284c7" />

            {/* Node 2: Stage 2 Active Milestone (35, 385) */}
            <g transform="translate(35, 385)">
              <circle r="14" fill="rgba(2, 132, 199, 0.18)" />
              <circle r="10" fill="#ffffff" stroke="#0284c7" strokeWidth="2.4" />
              <circle r="4" fill="#0284c7" />
            </g>

            {/* Anchor dot on Card 3 top-left */}
            <circle cx="130" cy="435" r="3.5" fill="#0284c7" />
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
