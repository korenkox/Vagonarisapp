
import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768; // Tailwind 'md' breakpoint

export const useIsMobile = () => {
  // Initialize with correct value if window exists, otherwise default to true (mobile-first)
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Initial check (in case of orientation change etc.)
    handleResize();

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};
