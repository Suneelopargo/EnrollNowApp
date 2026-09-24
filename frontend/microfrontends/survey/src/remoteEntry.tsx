// frontend/microfrontends/survey/src/remoteEntry.tsx - Survey MFE Remote Entry
import React, { useState } from 'react';
import { MfeContext } from '../../../shared/contracts';
import { SurveyDashboardView } from './views/SurveyDashboardView';
import { SurveyListView } from './views/SurveyListView';
import { SurveyBuilder } from './builder/SurveyBuilder';
import { SurveyAssignmentsView } from './views/SurveyAssignmentsView';
import { SurveyResponsesView } from './views/SurveyResponsesView';
import { SurveyAnalyticsView } from './views/SurveyAnalyticsView';
import { MySurveysView } from './views/MySurveysView';
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  UserCheck,
  BarChart3,
  UserCheck2,
} from 'lucide-react';

export interface SurveyModuleProps {
  context: MfeContext;
}

type TabType =
  | 'dashboard'
  | 'surveys'
  | 'builder'
  | 'assignments'
  | 'responses'
  | 'analytics'
  | 'my-surveys';

export const SurveyModule: React.FC<SurveyModuleProps> = ({ context }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [editingSurveyId, setEditingSurveyId] = useState<number | undefined>(undefined);
  const [inspectSurveyId, setInspectSurveyId] = useState<number | undefined>(undefined);

  const isParticipant =
    context?.user?.roles?.includes('PARTICIPANT') ||
    context?.user?.roles?.includes('PATIENT');

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 font-sans">
      {/* MFE Navigation Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1 overflow-x-auto">
        {!isParticipant && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('surveys')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'surveys'
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ClipboardList size={15} />
              <span>Questionnaires</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingSurveyId(undefined);
                setActiveTab('builder');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'builder'
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <PlusCircle size={15} />
              <span>{editingSurveyId ? 'Edit Survey' : 'New Survey'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('assignments')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'assignments'
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <UserCheck size={15} />
              <span>Assignments</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('my-surveys')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'my-surveys'
              ? 'bg-blue-50 text-blue-700 shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <UserCheck2 size={15} />
          <span>My Questionnaires</span>
        </button>
      </div>

      {/* Main Tab Routing */}
      {activeTab === 'dashboard' && (
        <SurveyDashboardView
          onCreateSurvey={() => {
            setEditingSurveyId(undefined);
            setActiveTab('builder');
          }}
          onSelectSurvey={(id) => {
            setEditingSurveyId(id);
            setActiveTab('builder');
          }}
          onViewAllSurveys={() => setActiveTab('surveys')}
          onViewAnalytics={(id) => {
            setInspectSurveyId(id);
            setActiveTab('analytics');
          }}
        />
      )}

      {activeTab === 'surveys' && (
        <SurveyListView
          onCreateSurvey={() => {
            setEditingSurveyId(undefined);
            setActiveTab('builder');
          }}
          onEditSurvey={(id) => {
            setEditingSurveyId(id);
            setActiveTab('builder');
          }}
          onViewAnalytics={(id) => {
            setInspectSurveyId(id);
            setActiveTab('analytics');
          }}
          onViewResponses={(id) => {
            setInspectSurveyId(id);
            setActiveTab('responses');
          }}
        />
      )}

      {activeTab === 'builder' && (
        <SurveyBuilder
          surveyId={editingSurveyId}
          onDone={() => setActiveTab('surveys')}
          onCancel={() => setActiveTab('surveys')}
        />
      )}

      {activeTab === 'assignments' && <SurveyAssignmentsView />}

      {activeTab === 'responses' && (
        <SurveyResponsesView
          surveyId={inspectSurveyId}
          onBack={() => setActiveTab('surveys')}
        />
      )}

      {activeTab === 'analytics' && inspectSurveyId && (
        <SurveyAnalyticsView
          surveyId={inspectSurveyId}
          onBack={() => setActiveTab('surveys')}
        />
      )}

      {activeTab === 'my-surveys' && <MySurveysView />}
    </div>
  );
};

export default SurveyModule;
