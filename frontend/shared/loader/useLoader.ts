// frontend/shared/loader/useLoader.ts - React Hook for Global Loader State
import { useState, useEffect } from 'react';
import { loaderManager } from './loaderManager';
import { LoaderState } from './types';

export function useLoader(): LoaderState {
  const [state, setState] = useState<LoaderState>(loaderManager.getState());

  useEffect(() => {
    const unsubscribe = loaderManager.subscribe((nextState) => {
      setState(nextState);
    });
    return unsubscribe;
  }, []);

  return state;
}
