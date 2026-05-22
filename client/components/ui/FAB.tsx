'use client';

interface FABProps {
  onClick: () => void;
  label?: string;
}

export function FAB({ onClick, label = 'Add' }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-[76px] right-4 w-14 h-14 bg-gradient-to-br from-primary to-primary-dark text-white rounded-full shadow-fab flex items-center justify-center z-20 hover:brightness-110 active:scale-95 transition-all duration-150"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );
}
