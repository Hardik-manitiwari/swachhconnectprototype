import React from 'react';

interface SegmentedBarProps {
  percentage: number;
  segmentsCount?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SegmentedBar: React.FC<SegmentedBarProps> = ({
  percentage,
  segmentsCount = 10,
  showLabel = true,
  size = 'md',
}) => {
  const clamped = Math.max(0, Math.min(100, percentage));
  const activeSegments = Math.round((clamped / 100) * segmentsCount);

  // Status color based on Civic Utility Design System:
  // 0-60%: Forest Green (#154212)
  // 61-85%: Amber (#d97706)
  // 86-100%: Critical Red (#ba1a1a)
  const getStatusColor = (val: number) => {
    if (val <= 60) return 'text-[#154212] bg-[#154212]';
    if (val <= 85) return 'text-[#d97706] bg-[#d97706]';
    return 'text-[#ba1a1a] bg-[#ba1a1a]';
  };

  const getSegmentColorClass = (index: number) => {
    const isFilled = index < activeSegments;
    if (!isFilled) return 'bg-[#e2e8f0]';
    if (clamped <= 60) return 'bg-[#154212]';
    if (clamped <= 85) return 'bg-[#d97706]';
    return 'bg-[#ba1a1a]';
  };

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className="w-full flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        {showLabel && (
          <>
            <span className="font-medium text-[#42493e] flex items-center gap-1">
              <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor(clamped).split(' ')[1]}`} />
              {clamped <= 60 ? 'Optimal' : clamped <= 85 ? 'High Attention' : 'Critical (Overflow Risk)'}
            </span>
            <span className="font-mono font-semibold text-[#191c1e]">{clamped}%</span>
          </>
        )}
      </div>
      <div className="flex gap-[3px] w-full" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        {Array.from({ length: segmentsCount }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-[1.5px] transition-colors duration-200 ${heightClass} ${getSegmentColorClass(i)}`}
          />
        ))}
      </div>
    </div>
  );
};
