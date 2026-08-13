/** 12-column desktop span, shared by FormField and DetailItem. */
export type FieldSpan = 3 | 4 | 6 | 8 | 12;

/** Tablet collapses toward a 2-column rhythm; mobile always goes full-width via CSS, independent of this map. */
export const TABLET_SPAN: Record<FieldSpan, FieldSpan> = {
  3: 6,
  4: 6,
  6: 6,
  8: 12,
  12: 12,
};
