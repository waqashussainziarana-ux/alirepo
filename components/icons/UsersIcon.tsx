import React from 'react';

export const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.5-2.962c.57-1.007 1.284-1.923 2.18-2.732a9.124 9.124 0 0 1 5.093-2.315m-11.482 5.047a9.124 9.124 0 0 1 5.093-2.315M12 11.25a3.375 3.375 0 1 0 0-6.75 3.375 3.375 0 0 0 0 6.75ZM21 12.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);
