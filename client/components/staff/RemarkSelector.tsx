'use client';
import { useTranslation } from 'react-i18next';
import { PRESET_REMARKS } from '@/constants/remarks';

interface RemarkSelectorProps {
  selected: string | null;
  onSelect: (remarkId: string | null) => void;
}

const severityConfig = {
  low:    { dot: 'bg-success', ring: 'border-success/50 bg-success/5', label: 'text-success' },
  medium: { dot: 'bg-flagged', ring: 'border-flagged/50 bg-flagged/5', label: 'text-flagged' },
  high:   { dot: 'bg-danger',  ring: 'border-danger/50  bg-danger/5',  label: 'text-danger'  },
};

export function RemarkSelector({ selected, onSelect }: RemarkSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      {PRESET_REMARKS.map(remark => {
        const isSelected = selected === remark.id;
        const { dot, ring } = severityConfig[remark.severity];
        return (
          <button
            key={remark.id}
            onClick={() => onSelect(isSelected ? null : remark.id)}
            className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-150 flex items-center gap-3
              ${isSelected
                ? `border-primary bg-primary/5 shadow-sm`
                : `border-transparent bg-white shadow-card hover:shadow-card-md hover:border-gray-200`
              }`}
          >
            {/* Severity dot */}
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSelected ? 'bg-primary' : dot}`} />
            <span className={`text-sm font-medium flex-1 ${isSelected ? 'text-primary-dark' : 'text-gray-800'}`}>
              {t(`remark.${remark.id}`)}
            </span>
            {isSelected && (
              <svg className="w-4 h-4 text-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
