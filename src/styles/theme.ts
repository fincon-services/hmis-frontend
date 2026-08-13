import type { ThemeConfig } from 'antd';

/**
 * Institutional healthcare-system palette: navy/blue-gray text on white/light
 * gray, a restrained teal-blue accent, subtle borders, moderate radius, no
 * heavy shadows or gradients. Deliberately un-flashy — see Frontend
 * Prompt.txt §12/§13.
 */
export const colors = {
  primary: '#0f5b78', // restrained institutional teal-blue
  primaryHover: '#0c4a61',
  textPrimary: '#1a2530', // dark navy/blue-gray
  textSecondary: '#4d5c6b',
  border: '#d7dde3',
  bgLayout: '#f3f5f7',
  bgContainer: '#ffffff',
  success: '#1a7a4c',
  warning: '#a5680c',
  error: '#b3261e',
  info: '#0f5b78',
};

export const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  success: { bg: '#eaf6ef', text: colors.success, border: '#bfe4cd' },
  warning: { bg: '#fbf1e0', text: colors.warning, border: '#f0d9a8' },
  error: { bg: '#fbeceb', text: colors.error, border: '#f2c6c3' },
  info: { bg: '#e9f2f5', text: colors.info, border: '#bcdbe3' },
  default: { bg: '#f0f1f3', text: colors.textSecondary, border: colors.border },
};

/**
 * Shared spacing scale — used by FormGrid/FormField/FormSection/DetailGrid and
 * any other layout primitive instead of ad hoc inline pixel values, so
 * density stays consistent across the whole app.
 */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Compact-but-comfortable control height for a data-entry-dense HMIS — antd's default (32) reads cramped next to labels, 40+ wastes vertical space across long forms. */
export const controlHeight = 36;

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: colors.primary,
    colorText: colors.textPrimary,
    colorTextSecondary: colors.textSecondary,
    colorBorder: colors.border,
    colorBgLayout: colors.bgLayout,
    colorBgContainer: colors.bgContainer,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.error,
    colorInfo: colors.info,
    borderRadius: 6,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontSize: 14,
    boxShadow: 'none',
    boxShadowSecondary: '0 1px 2px rgba(16, 24, 32, 0.06)',
    controlHeight,
    controlHeightSM: 28,
    controlHeightLG: 40,
  },
  components: {
    Layout: {
      headerBg: colors.bgContainer,
      siderBg: '#132a3a',
      bodyBg: colors.bgLayout,
    },
    Menu: {
      darkItemBg: '#132a3a',
      darkItemSelectedBg: colors.primary,
      darkSubMenuItemBg: '#0f2330',
    },
    Table: {
      headerBg: '#f7f9fa',
      headerColor: colors.textPrimary,
      borderColor: colors.border,
      cellPaddingBlock: 8,
      cellPaddingInline: 12,
    },
    Card: {
      boxShadowTertiary: 'none',
      headerPadding: 14,
      bodyPadding: 16,
    },
    Form: {
      itemMarginBottom: 14,
      verticalLabelPadding: '0 0 4px',
      labelFontSize: 13,
    },
    Select: {
      controlHeight,
    },
    InputNumber: {
      controlHeight,
    },
    DatePicker: {
      controlHeight,
    },
    Input: {
      controlHeight,
    },
    Modal: {
      headerBg: colors.bgContainer,
      titleFontSize: 15,
      padding: 20,
      paddingContentHorizontalLG: 24,
    },
    Descriptions: {
      titleMarginBottom: 10,
      labelBg: '#f7f9fa',
    },
    Tabs: {
      horizontalMargin: '0 0 12px 0',
      cardPadding: '8px 14px',
      titleFontSize: 13,
    },
    Drawer: {
      paddingLG: 20,
    },
  },
};
