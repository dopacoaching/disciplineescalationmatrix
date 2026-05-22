'use client';

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative w-9 h-9">
        <div className="absolute inset-0 rounded-full border-[3px] border-primary/15" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-spin" />
      </div>
    </div>
  );
}
