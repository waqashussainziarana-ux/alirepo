
import React from 'react';

export const TableIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    {...props}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5V6.25c0-.621.504-1.125 1.125-1.125h15a1.125 1.125 0 0 1 1.125 1.125v12.125m-17.25 0h17.25m-17.25 0a1.125 1.125 0 0 0 1.125 1.125M21 19.5a1.125 1.125 0 0 1-1.125 1.125m0 0a1.125 1.125 0 0 1-1.125-1.125M21 19.5V6.25M3.75 9h16.5M3.75 13.5h16.5M12 21V5.25" 
    />
  </svg>
);
