export const calculateCurrentAge = (birthdayStr?: string, fallbackAge?: string): string => {
  if (!birthdayStr || !birthdayStr.trim()) {
    const age = fallbackAge?.trim();
    if (!age || age.toLowerCase() === 'n/a') return '--';

    const ageMatch = age.match(/^(\d+)\s*(?:years?|yrs?)?(?:\s+(\d+)\s*months?)?$/i);
    if (ageMatch) {
      const years = Number(ageMatch[1]);
      const months = Number(ageMatch[2] || 0);
      return `${years} ${years === 1 ? 'year' : 'years'} ${months} ${months === 1 ? 'month' : 'months'}`;
    }

    return age;
  }
  const str = birthdayStr.trim();
  let birthDate: Date | null = null;
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (!isNaN(month) && !isNaN(day) && !isNaN(year) && month >= 0 && month < 12 && day >= 1 && day <= 31) {
        birthDate = new Date(year, month, day);
      }
    }
  } else if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(month) && !isNaN(day) && !isNaN(year) && month >= 0 && month < 12 && day >= 1 && day <= 31) {
        birthDate = new Date(year, month, day);
      }
    }
  }

  if (!birthDate || isNaN(birthDate.getTime())) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      birthDate = d;
    } else {
      return 'Invalid Date';
    }
  }

  const today = new Date();
  if (birthDate > today) {
    return 'Invalid (Future Date)';
  }

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  if (today.getDate() < birthDate.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years < 0) return '--';

  const yLabel = years === 1 ? 'year' : 'years';
  const mLabel = months === 1 ? 'month' : 'months';
  return `${years} ${yLabel} ${months} ${mLabel}`;
};

export const formatDobForDateInput = (birthdayStr?: string): string => {
  if (!birthdayStr?.trim()) return '';

  const value = birthdayStr.trim();
  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const legacyDate = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const year = Number(isoDate?.[1] || legacyDate?.[3]);
  const month = Number(isoDate?.[2] || legacyDate?.[1]);
  const day = Number(isoDate?.[3] || legacyDate?.[2]);
  if (!year || !month || !day) return '';

  const parsedDate = new Date(year, month - 1, day);
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return '';
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};
