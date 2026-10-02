import React, { createContext, useContext, useState } from 'react';
import { AnalyzeResponse } from '@/services/api';

interface InspectionContextType {
  currentAnalysis: AnalyzeResponse | null;
  setCurrentAnalysis: (data: AnalyzeResponse | null) => void;
  clearAnalysis: () => void;
}

const InspectionContext = createContext<InspectionContextType | undefined>(undefined);

export function InspectionProvider({ children }: { children: React.ReactNode }) {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalyzeResponse | null>(null);

  return (
    <InspectionContext.Provider value={{
      currentAnalysis,
      setCurrentAnalysis,
      clearAnalysis: () => setCurrentAnalysis(null)
    }}>
      {children}
    </InspectionContext.Provider>
  );
}

export function useInspection() {
  const context = useContext(InspectionContext);
  if (context === undefined) {
    throw new Error('useInspection must be used within an InspectionProvider');
  }
  return context;
}
