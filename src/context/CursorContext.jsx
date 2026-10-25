import React, { createContext, useContext, useEffect, useState } from 'react';

// Cursor Modes: 'default' (system), 'magnetic' (dual-ring), 'trail' (pixel trail)
const CursorContext = createContext();

export function CursorProvider({ children }) {
  const [cursorMode, setCursorMode] = useState(() => {
    const saved = localStorage.getItem('dta_cursor_mode');
    if (saved === 'magnetic' || saved === 'trail' || saved === 'default') {
      return saved;
    }
    return 'default';
  });

  useEffect(() => {
    localStorage.setItem('dta_cursor_mode', cursorMode);
  }, [cursorMode]);

  const cycleCursorMode = () => {
    setCursorMode((prev) => {
      if (prev === 'default') return 'magnetic';
      if (prev === 'magnetic') return 'trail';
      return 'default';
    });
  };

  return (
    <CursorContext.Provider value={{ cursorMode, setCursorMode, cycleCursorMode }}>
      {children}
    </CursorContext.Provider>
  );
}

export function useCursor() {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return context;
}
