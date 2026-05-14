'use client';
import { useTranslation } from 'react-i18next';
import { PRESET_REMARKS } from '@/constants/remarks';

interface RemarkSelectorProps {
  selected: string | null;
  onSelect: (remarkId: string | null) => void;
}

export function RemarkSelector({ selected, onSelect }: RemarkSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      {PRESET_REMARKS.map(remark => {
        const isSelected = selected === remark.id;
        return (
          <button
            key={remark.id}
            onClick={() => onSelect(isSelected ? null : remark.id)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              isSelected
                ? 'border-primary bg-primary-bg'
                : 'border-transparent bg-white shadow-sm'
            }`}
          >
            <span className="text-sm font-medium text-gray-800">
              {t(`remark.${remark.id}`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
