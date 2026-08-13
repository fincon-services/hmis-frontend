import type { LucideIcon } from 'lucide-react';

interface FormSectionProps {
  label: string;
  description?: string;
  icon?: LucideIcon;
  /** Set on the first section in a form so it doesn't carry a leading top margin. */
  first?: boolean;
}

/**
 * Compact section header inside a `FormGrid` — spans the full row (see
 * `.form-section-header` in index.css) and visually separates a logical
 * group of fields (Demographic, Personal, Contact, ...) without the cost of
 * a nested Card per group.
 */
export function FormSection({ label, description, icon: Icon, first }: FormSectionProps) {
  return (
    <div className={first ? 'form-section-header form-section-header-first' : 'form-section-header'}>
      {Icon && <Icon size={15} className="form-section-icon" />}
      <div>
        <span className="form-section-label">{label}</span>
        {description && <span className="form-section-description">{description}</span>}
      </div>
    </div>
  );
}
