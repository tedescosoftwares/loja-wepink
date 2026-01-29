import { useState, useEffect } from "react";

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = () => {
    const authenticated = localStorage.getItem("adminAuthenticated");
    const timestamp = localStorage.getItem("adminAuthTimestamp");
    
    console.log('useAdminAuth: checkAdminAuth - authenticated:', authenticated, 'timestamp:', timestamp);
    
    if (authenticated === "true" && timestamp) {
      const authTime = parseInt(timestamp);
      const now = Date.now();
      const authDuration = 24 * 60 * 60 * 1000; // 24 hours
      
      if (now - authTime < authDuration) {
        console.log('useAdminAuth: Auth still valid');
        setIsAuthenticated(true);
      } else {
        // Auth expired
        console.log('useAdminAuth: Auth expired');
        localStorage.removeItem("adminAuthenticated");
        localStorage.removeItem("adminAuthTimestamp");
        setIsAuthenticated(false);
      }
    } else {
      console.log('useAdminAuth: Not authenticated');
      setIsAuthenticated(false);
    }
    
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("adminAuthTimestamp");
    setIsAuthenticated(false);
  };

  const login = () => {
    localStorage.setItem("adminAuthenticated", "true");
    localStorage.setItem("adminAuthTimestamp", Date.now().toString());
    setIsAuthenticated(true);
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAdminAuth
  };
}
