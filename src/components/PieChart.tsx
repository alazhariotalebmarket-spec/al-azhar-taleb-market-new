import React, { useMemo, useState } from 'react';

export interface PieSegment {
  key: string;
  label: string;
  value: number;
  formattedValue: string;
  color: string;
}

interface PieChartProps {
  segments: PieSegment[];
  sizePx?: number;
  ariaLabel?: string;
  emptyText?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  segments,
  sizePx = 104,
  ariaLabel = 'রাউন্ড পাই চার্ট',
  emptyText = 'কোনো হিসাব নেই',
}) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const total = useMemo(
    () => segments.reduce((sum, seg) => sum + Math.max(0, seg.value), 0),
    [segments]
  );

  const positiveSegments = useMemo(
    () => segments.filter((seg) => seg.value > 0),
    [segments]
  );

  const computedSlices = useMemo(() => {
    const cx = 50;
    const cy = 50;
    const r = 46;
    let currentAngle = -90;

    return positiveSegments.map((seg) => {
      const safeVal = Math.max(0, seg.value);
      const pct = total > 0 ? (safeVal / total) * 100 : 0;
      const sweep = total > 0 ? (safeVal / total) * 360 : 0;

      const startRad = (currentAngle * Math.PI) / 180;
      const endRad = ((currentAngle + sweep) * Math.PI) / 180;

      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);
      const largeArc = sweep > 180 ? 1 : 0;

      const midAngle = currentAngle + sweep / 2;
      const midRad = (midAngle * Math.PI) / 180;
      const labelX = cx + r * 0.56 * Math.cos(midRad);
      const labelY = cy + r * 0.56 * Math.sin(midRad);

      const d = `M ${cx} ${cy} L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`;

      currentAngle += sweep;

      return {
        ...seg,
        pct,
        d,
        labelX,
        labelY,
      };
    });
  }, [positiveSegments, total]);

  const activeSegment = useMemo(() => {
    if (!selectedKey) return null;
    return computedSlices.find((s) => s.key === selectedKey) || null;
  }, [computedSlices, selectedKey]);

  const toggleSlice = (key: string) => {
    setSelectedKey((prev) => (prev === key ? null : key));
  };

  return (
    <div className="flex flex-col items-center gap-2.5 w-full">
      <div
        style={{ width: sizePx, height: sizePx }}
        className="relative shrink-0 touch-manipulation"
      >
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full overflow-visible drop-shadow-2xs"
          role="img"
          aria-label={ariaLabel}
        >
          {total <= 0 ? (
            <circle cx={50} cy={50} r={46} fill="#e2e8f0" />
          ) : positiveSegments.length === 1 ? (
            <g>
              <circle
                cx={50}
                cy={50}
                r={46}
                fill={positiveSegments[0].color}
                stroke="#ffffff"
                strokeWidth="1.5"
                className="cursor-pointer transition-opacity"
                onClick={() => toggleSlice(positiveSegments[0].key)}
              />
              <text
                x={50}
                y={53}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="12"
                fontWeight="700"
                className="pointer-events-none font-mono-num"
              >
                100%
              </text>
            </g>
          ) : (
            computedSlices.map((slice) => {
              const isSelected = selectedKey === slice.key;
              const isDimmed = selectedKey !== null && !isSelected;

              return (
                <g
                  key={slice.key}
                  className="cursor-pointer transition-opacity duration-200 outline-none"
                  opacity={isDimmed ? 0.4 : 1}
                  role="button"
                  tabIndex={0}
                  aria-label={`${slice.label}: ${slice.formattedValue} (${slice.pct.toFixed(0)}%)`}
                  onClick={() => toggleSlice(slice.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleSlice(slice.key);
                    }
                  }}
                >
                  <path
                    d={slice.d}
                    fill={slice.color}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? '2.4' : '1.6'}
                  />
                  {slice.pct >= 12 && (
                    <text
                      x={slice.labelX}
                      y={slice.labelY + 3.5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="700"
                      className="pointer-events-none font-mono-num"
                    >
                      {Math.round(slice.pct)}%
                    </text>
                  )}
                </g>
              );
            })
          )}
        </svg>
      </div>

      {total <= 0 ? (
        <p className="text-[11px] text-slate-400">{emptyText}</p>
      ) : (
        <>
          {activeSegment && (
            <div className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800 flex items-center justify-between gap-1.5 shadow-2xs">
              <span className="flex items-center gap-1.5 truncate">
                <span
                  className="inline-block h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: activeSegment.color }}
                />
                <span className="truncate">{activeSegment.label}</span>
              </span>
              <span className="font-mono-num shrink-0" style={{ color: activeSegment.color }}>
                {activeSegment.pct.toFixed(1)}%
              </span>
            </div>
          )}

          <div className="w-full divide-y divide-slate-200/70 rounded-lg border border-slate-200 bg-white overflow-hidden">
            {segments.map((seg) => {
              const pct = total > 0 ? (Math.max(0, seg.value) / total) * 100 : 0;
              const isSelected = selectedKey === seg.key;
              return (
                <button
                  key={seg.key}
                  type="button"
                  onClick={() => toggleSlice(seg.key)}
                  className={`flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-[11px] transition-colors ${
                    isSelected ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="inline-block h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="truncate font-medium text-slate-700">{seg.label}</span>
                  </span>
                  <span className="font-mono-num font-bold text-slate-900 whitespace-nowrap shrink-0">
                    {seg.formattedValue}
                    <span className="ml-1 text-[10px] font-medium text-slate-500">
                      ({pct.toFixed(0)}%)
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
