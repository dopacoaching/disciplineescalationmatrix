'use client';
import '@/lib/i18n';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col items-center justify-center px-6 text-center space-y-6">
      <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center">
        <svg className="w-11 h-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Discipline Escalation Matrix</h1>
        <p className="text-gray-500 mt-3 max-w-xs">
          You are offline. Please reconnect to submit entries.
        </p>
        <p className="text-gray-400 mt-1 max-w-xs text-sm">
          ഓഫ്‌ലൈൻ. എൻട്രികൾ സമർപ്പിക്കാൻ ദയവായി വീണ്ടും ബന്ധിപ്പിക്കൂ.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
