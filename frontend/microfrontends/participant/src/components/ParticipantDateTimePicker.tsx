// frontend/microfrontends/participant/src/components/ParticipantDateTimePicker.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface ParticipantDateTimePickerProps {
  id?: string;
  value?: string; // Expects "MM/DD/YYYY hh:mm A" or ISO string
  onChange: (formattedValue: string) => void;
  disabled?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Helpers
function parseDateParts(dateStr?: string): { date: Date | null; hours: number; minutes: number; isPm: boolean } {
  if (!dateStr || !dateStr.trim()) {
    return { date: null, hours: 12, minutes: 0, isPm: false };
  }

  // Check if standard "MM/DD/YYYY hh:mm A" format
  const customMatch = dateStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?$/i);
  if (customMatch) {
    const month = parseInt(customMatch[1], 10) - 1;
    const day = parseInt(customMatch[2], 10);
    const year = parseInt(customMatch[3], 10);
    let hours = customMatch[4] ? parseInt(customMatch[4], 10) : 12;
    const minutes = customMatch[5] ? parseInt(customMatch[5], 10) : 0;
    const ampm = customMatch[6] ? customMatch[6].toUpperCase() : 'AM';
    const isPm = ampm === 'PM';

    const d = new Date(year, month, day);
    return { date: isNaN(d.getTime()) ? null : d, hours: hours > 12 ? 12 : hours || 12, minutes, isPm };
  }

  // Fallback to JS Date parser (ISO etc.)
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    const rawHours = parsed.getHours();
    const isPm = rawHours >= 12;
    const hours = rawHours % 12 || 12;
    const minutes = parsed.getMinutes();
    const d = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    return { date: d, hours, minutes, isPm };
  }

  return { date: null, hours: 12, minutes: 0, isPm: false };
}

function formatResult(date: Date, hours: number, minutes: number, isPm: boolean): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();

  const hh = String(hours).padStart(2, '0');
  const min = String(minutes).padStart(2, '0');
  const ampm = isPm ? 'PM' : 'AM';

  return `${mm}/${dd}/${yyyy} ${hh}:${min} ${ampm}`;
}

export const ParticipantDateTimePicker: React.FC<ParticipantDateTimePickerProps> = ({
  id = 'participant-date-time-picker',
  value = '',
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date');

  const parsed = parseDateParts(value);
  const [selectedDate, setSelectedDate] = useState<Date | null>(parsed.date);
  const [hours, setHours] = useState<number>(parsed.hours);
  const [minutes, setMinutes] = useState<number>(parsed.minutes);
  const [isPm, setIsPm] = useState<boolean>(parsed.isPm);

  // View state for navigating calendar
  const initialYear = parsed.date ? parsed.date.getFullYear() : new Date().getFullYear();
  const initialMonth = parsed.date ? parsed.date.getMonth() : new Date().getMonth();
  const [viewYear, setViewYear] = useState<number>(initialYear);
  const [viewMonth, setViewMonth] = useState<number>(initialMonth);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with value changes from parent
  useEffect(() => {
    const p = parseDateParts(value);
    setSelectedDate(p.date);
    setHours(p.hours);
    setMinutes(p.minutes);
    setIsPm(p.isPm);
    if (p.date) {
      setViewYear(p.date.getFullYear());
      setViewMonth(p.date.getMonth());
    }
  }, [value]);

  // Close popup on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day);
    setSelectedDate(newDate);
    const result = formatResult(newDate, hours, minutes, isPm);
    onChange(result);
  };

  const handleTimeChange = (newHours: number, newMinutes: number, newIsPm: boolean) => {
    setHours(newHours);
    setMinutes(newMinutes);
    setIsPm(newIsPm);
    const baseDate = selectedDate || new Date();
    setSelectedDate(baseDate);
    const result = formatResult(baseDate, newHours, newMinutes, newIsPm);
    onChange(result);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(null);
    onChange('');
  };

  const handleSetNow = () => {
    const now = new Date();
    setSelectedDate(now);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    const rawHours = now.getHours();
    const pm = rawHours >= 12;
    const h = rawHours % 12 || 12;
    const m = now.getMinutes();
    setHours(h);
    setMinutes(m);
    setIsPm(pm);
    onChange(formatResult(now, h, m, pm));
  };

  // Build 42 calendar cells (6 weeks)
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays: Array<{ day: number; isCurrentMonth: boolean; isPrevMonth?: boolean; isNextMonth?: boolean }> = [];

  // Trailing days from previous month
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({ day: daysInPrevMonth - i, isCurrentMonth: false, isPrevMonth: true });
  }

  // Days of current month
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    calendarDays.push({ day: i, isCurrentMonth: true });
  }

  // Leading days of next month to complete rows
  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false, isNextMonth: true });
  }

  // Year options list around current year (+-30 years)
  const currentYear = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let y = currentYear - 30; y <= currentYear + 15; y++) {
    yearOptions.push(y);
  }

  const isToday = (day: number) => {
    const now = new Date();
    return now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === day;
  };

  const isSelected = (day: number) => {
    return (
      selectedDate !== null &&
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    );
  };

  const formattedDisplay = selectedDate ? formatResult(selectedDate, hours, minutes, isPm) : '';

  return (
    <div ref={containerRef} className="participant-date-time-picker" data-testid="participant-date-time-picker">
      <div
        className={`participant-date-time-picker__input-container ${disabled ? 'disabled' : ''}`}
        onClick={() => {
          if (!disabled) setIsOpen(true);
        }}
      >
        <div className="participant-date-time-picker__display">
          {formattedDisplay ? (
            <div className="participant-date-time-picker__text">
              <span className="participant-date-time-picker__date-part">
                {String(selectedDate?.getMonth()! + 1).padStart(2, '0')}/{String(selectedDate?.getDate()).padStart(2, '0')}/{selectedDate?.getFullYear()}
              </span>
              <span className="participant-date-time-picker__time-part">
                {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')} {isPm ? 'PM' : 'AM'}
              </span>
            </div>
          ) : (
            <span className="participant-date-time-picker__placeholder">MM/DD/YYYY hh:mm A</span>
          )}
        </div>

        <div className="participant-date-time-picker__icons">
          {formattedDisplay && !disabled && (
            <button
              type="button"
              className="participant-date-time-picker__clear-btn"
              onClick={handleClear}
              title="Clear date"
              aria-label="Clear date"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            className={`participant-date-time-picker__icon-btn ${activeTab === 'date' && isOpen ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) {
                setActiveTab('date');
                setIsOpen(true);
              }
            }}
            title="Open calendar"
            aria-label="Open calendar"
          >
            <CalendarIcon size={16} />
          </button>
          <button
            type="button"
            className={`participant-date-time-picker__icon-btn ${activeTab === 'time' && isOpen ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) {
                setActiveTab('time');
                setIsOpen(true);
              }
            }}
            title="Set time"
            aria-label="Set time"
          >
            <Clock size={16} />
          </button>
        </div>
      </div>

      {/* POPUP MODAL / CALENDAR DROPDOWN */}
      {isOpen && (
        <div className="participant-date-time-picker__popup" role="dialog" aria-modal="true">
          {/* Header Mode Switcher (Date / Time) */}
          <div className="participant-date-time-picker__tab-bar">
            <button
              type="button"
              className={`participant-date-time-picker__tab ${activeTab === 'date' ? 'active' : ''}`}
              onClick={() => setActiveTab('date')}
            >
              <CalendarIcon size={14} /> Date
            </button>
            <button
              type="button"
              className={`participant-date-time-picker__tab ${activeTab === 'time' ? 'active' : ''}`}
              onClick={() => setActiveTab('time')}
            >
              <Clock size={14} /> Time ({String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')} {isPm ? 'PM' : 'AM'})
            </button>
          </div>

          {activeTab === 'date' && (
            <div className="participant-date-time-picker__calendar">
              {/* Month / Year Navigator */}
              <div className="participant-date-time-picker__nav">
                <button
                  type="button"
                  className="participant-date-time-picker__nav-btn"
                  onClick={handlePrevMonth}
                  aria-label="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="participant-date-time-picker__selects">
                  <select
                    className="participant-date-time-picker__select"
                    value={viewMonth}
                    onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                    aria-label="Select Month"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={idx}>
                        {name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="participant-date-time-picker__select"
                    value={viewYear}
                    onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                    aria-label="Select Year"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className="participant-date-time-picker__nav-btn"
                  onClick={handleNextMonth}
                  aria-label="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Day of Week Headers */}
              <div className="participant-date-time-picker__weekdays">
                {DAYS_OF_WEEK.map((d) => (
                  <span key={d} className="participant-date-time-picker__weekday">
                    {d}
                  </span>
                ))}
              </div>

              {/* Day Matrix */}
              <div className="participant-date-time-picker__days-grid">
                {calendarDays.map((cell, idx) => {
                  const daySelected = cell.isCurrentMonth && isSelected(cell.day);
                  const dayToday = cell.isCurrentMonth && isToday(cell.day);

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!cell.isCurrentMonth}
                      className={`participant-date-time-picker__day-cell ${
                        cell.isCurrentMonth ? 'current' : 'muted'
                      } ${daySelected ? 'selected' : ''} ${dayToday ? 'today' : ''}`}
                      onClick={() => {
                        if (cell.isCurrentMonth) {
                          handleSelectDay(cell.day);
                        }
                      }}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'time' && (
            <div className="participant-date-time-picker__time-picker">
              <div className="participant-date-time-picker__time-inputs">
                <div className="participant-date-time-picker__time-col">
                  <label className="participant-date-time-picker__time-label">Hour</label>
                  <select
                    className="participant-date-time-picker__time-select"
                    value={hours}
                    onChange={(e) => handleTimeChange(parseInt(e.target.value, 10), minutes, isPm)}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="participant-date-time-picker__time-separator">:</span>

                <div className="participant-date-time-picker__time-col">
                  <label className="participant-date-time-picker__time-label">Minute</label>
                  <select
                    className="participant-date-time-picker__time-select"
                    value={minutes}
                    onChange={(e) => handleTimeChange(hours, parseInt(e.target.value, 10), isPm)}
                  >
                    {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="participant-date-time-picker__time-col">
                  <label className="participant-date-time-picker__time-label">AM / PM</label>
                  <div className="participant-date-time-picker__ampm-group">
                    <button
                      type="button"
                      className={`participant-date-time-picker__ampm-btn ${!isPm ? 'active' : ''}`}
                      onClick={() => handleTimeChange(hours, minutes, false)}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      className={`participant-date-time-picker__ampm-btn ${isPm ? 'active' : ''}`}
                      onClick={() => handleTimeChange(hours, minutes, true)}
                    >
                      PM
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="participant-date-time-picker__footer">
            <button
              type="button"
              className="participant-date-time-picker__footer-btn"
              onClick={handleSetNow}
            >
              Now
            </button>
            <button
              type="button"
              className="participant-date-time-picker__footer-btn participant-date-time-picker__footer-btn--primary"
              onClick={() => setIsOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
