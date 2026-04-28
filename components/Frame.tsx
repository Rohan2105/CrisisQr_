import React from 'react';

interface FrameProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  noPadding?: boolean;
}

export function Frame({ children, title, noPadding, className = '', ...props }: FrameProps) {
  return (
    <div className={`brutalist-frame flex flex-col ${className}`} {...props}>
      {title && (
        <div className="border-b border-border px-4 py-2 font-bold uppercase tracking-wider text-sm bg-background">
          {title}
        </div>
      )}
      <div className={`flex-grow relative ${noPadding ? '' : 'p-4'}`}>
        {children}
      </div>
    </div>
  );
}
