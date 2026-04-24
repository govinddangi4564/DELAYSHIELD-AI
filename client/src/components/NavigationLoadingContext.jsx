import React, { createContext, useContext, useMemo, useState } from 'react';

const NavigationLoadingContext = createContext(null);

export function NavigationLoadingProvider({ children }) {
  const [pendingPath, setPendingPath] = useState(null);

  const value = useMemo(() => ({
    pendingPath,
    startNavigation: (path) => setPendingPath(path),
    finishNavigation: (path) => {
      setPendingPath((current) => (current === path ? null : current));
    },
    clearNavigation: () => setPendingPath(null),
  }), [pendingPath]);

  return (
    <NavigationLoadingContext.Provider value={value}>
      {children}
    </NavigationLoadingContext.Provider>
  );
}

export function useNavigationLoading() {
  const context = useContext(NavigationLoadingContext);

  if (!context) {
    throw new Error('useNavigationLoading must be used within NavigationLoadingProvider');
  }

  return context;
}
