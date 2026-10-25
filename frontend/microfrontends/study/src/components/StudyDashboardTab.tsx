// frontend/microfrontends/study/src/components/StudyDashboardTab.tsx - Study Dashboard View
import React from 'react';

export interface StudyDashboardTabProps {
  selectedStudy: any;
  targetCount: number;
  recruitedCount: number;
  recruitmentProgress: number;
  weeklyRecruitment: { week: string; label: string; count: number }[];
  weeklyMaximum: number;
}

export const StudyDashboardTab: React.FC<StudyDashboardTabProps> = ({
  targetCount,
  recruitedCount,
  recruitmentProgress,
  weeklyRecruitment,
  weeklyMaximum,
}) => {
  return (
    <div className="study-dashboard-tab" role="tabpanel" id="study-tabpanel-dashboard" aria-labelledby="study-tab-dashboard">
      <section className="study-recruitment-panel" aria-labelledby="study-recruitment-title">
        <div className="study-recruitment-panel__heading">
          <div>
            <h2 id="study-recruitment-title">Recruitment Progress</h2>
            <p>{targetCount.toLocaleString()} participant recruitment target</p>
          </div>
          <strong>{recruitmentProgress}%</strong>
        </div>
        <div
          className="study-recruitment-scale"
          role="img"
          aria-label={`${recruitedCount} of ${targetCount} participants recruited, ${recruitmentProgress}% of target`}
        >
          <div className="study-recruitment-scale__track">
            <progress
              className="study-recruitment-scale__fill"
              value={recruitmentProgress}
              max={100}
              aria-hidden="true"
            />
          </div>
          <div className="study-recruitment-scale__ticks">
            {[0, 25, 50, 75, 100].map((tick) => (
              <span key={tick}>{tick}%</span>
            ))}
          </div>
        </div>
      </section>

      <section className="study-weekly-panel" aria-labelledby="study-weekly-title">
        <div className="study-weekly-panel__heading">
          <h2 id="study-weekly-title">Weekly Recruitment</h2>
          <span>Rolling participant accrual</span>
        </div>
        <div className="study-weekly-chart" role="region" aria-label="Weekly recruitment breakdown chart">
          <div className="study-weekly-chart__y-label">Participants</div>
          <div className="study-weekly-chart__plot">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Weekly participant recruitment bar chart">
              {[0, 25, 50, 75, 100].map((tick) => {
                const y = 85 - tick * 0.75;
                return <line key={tick} x1="4" x2="98" y1={y} y2={y} className="study-weekly-chart__gridline" />;
              })}
              {weeklyRecruitment.map((week, index) => {
                const step = 90 / Math.max(weeklyRecruitment.length, 1);
                const barWidth = Math.min(8, step * 0.55);
                const barHeight = Math.max(3, (week.count / weeklyMaximum) * 66);
                const x = 5 + index * step + (step - barWidth) / 2;
                return (
                  <rect
                    key={week.week}
                    x={x}
                    y={85 - barHeight}
                    width={barWidth}
                    height={barHeight}
                    rx="1.5"
                    className="study-weekly-chart__bar"
                  >
                    <title>
                      {week.label}: {week.count} participants
                    </title>
                  </rect>
                );
              })}
            </svg>
            {weeklyRecruitment.length === 0 && (
              <div className="study-weekly-chart__empty">No weekly recruitment records are available for this study yet.</div>
            )}
            {weeklyRecruitment.length > 0 && (
              <div className="study-weekly-chart__labels">
                {weeklyRecruitment.map((week) => (
                  <span key={week.week}>{week.label}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudyDashboardTab;
