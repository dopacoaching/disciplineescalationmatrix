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
      className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-20 hover:bg-primary-dark active:scale-95 transition-all"
    >
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );
}
