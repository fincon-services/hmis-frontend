import { statusColors } from '@/styles/theme';

export type StatusTone = keyof typeof statusColors;

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
}

/** Color communicates status but is never the only signal — label text always renders alongside. */
export function StatusBadge({ label, tone = 'default' }: StatusBadgeProps) {
  const { bg, text, border } = statusColors[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 500,
        background: bg,
        color: text,
        border: `1px solid ${border}`,
        lineHeight: '18px',
      }}
    >
      {label}
    </span>
  );
}

export function activeStatusTone(isActive: boolean): StatusTone {
  return isActive ? 'success' : 'default';
}
