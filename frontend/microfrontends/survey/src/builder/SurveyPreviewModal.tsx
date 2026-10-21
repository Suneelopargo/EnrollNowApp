import React, { useState } from 'react';
import { Survey } from '../types/survey';
import { SurveyRunner } from '../runner/SurveyRunner';
import { X, Smartphone, Tablet, Monitor } from 'lucide-react';
import { useFocusTrap } from '../../../../shared/accessibility/useFocusTrap';

interface SurveyPreviewModalProps {
  survey: Survey;
  isOpen: boolean;
  onClose: () => void;
}

export const SurveyPreviewModal: React.FC<SurveyPreviewModalProps> = ({
  survey,
  isOpen,
  onClose,
}) => {
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const trapRef = useFocusTrap<HTMLDivElement>({
    active: isOpen,
    onEscape: onClose,
    returnFocus: true,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-modal-title"
        tabIndex={-1}
        className="bg-slate-100 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="modal-title-bar bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 id="preview-modal-title" className="modal-title-bar__title font-bold text-slate-800 text-base">
              Survey Interactive Preview
            </h2>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
              Test Mode
            </span>
          </div>

          {/* Viewport switchers */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200" role="group" aria-label="Device viewport">
            <button
              type="button"
              onClick={() => setDeviceView('desktop')}
              aria-pressed={deviceView === 'desktop'}
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
                deviceView === 'desktop'
                  ? 'bg-white shadow text-sky-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceView('tablet')}
              aria-pressed={deviceView === 'tablet'}
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
                deviceView === 'tablet'
                  ? 'bg-white shadow text-sky-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tablet size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceView('mobile')}
              aria-pressed={deviceView === 'mobile'}
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
                deviceView === 'mobile'
                  ? 'bg-white shadow text-sky-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close survey preview dialog"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body with Viewport simulation */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center items-start">
          <div
            className={`transition-all duration-300 w-full ${
              deviceView === 'mobile'
                ? 'max-w-sm'
                : deviceView === 'tablet'
                ? 'max-w-2xl'
                : 'max-w-4xl'
            }`}
          >
            <SurveyRunner
              survey={survey}
              onSubmit={async (answers) => {
                alert('Test submission simulated successfully! Collected ' + answers.length + ' answer points.');
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyPreviewModal;
