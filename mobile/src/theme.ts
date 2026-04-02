// DayFlow Design System — Warm Minimal
// Based on Sankalp's design spec

export const colors = {
  bg: '#F5F0E8',
  surface: '#FFFFFF',
  surface2: '#F2EDE5',
  text: '#1A1714',
  text2: '#4A4540',
  muted: '#8C857D',
  border: '#E0D9CE',
  shadow: 'rgba(45,74,62,0.10)',

  // Primary (Forest green)
  primary: '#2D5A3E',
  primaryLight: '#3E7A55',
  primaryBg: '#E3ECE6',

  // Category palette
  terra: '#B5634A',
  terraLight: '#EEDDD4',
  sage: '#5A8C6A',
  sageLight: '#D4EADB',
  slate: '#3D5F80',
  slateLight: '#CBDCEE',
  mauve: '#7D5A7C',
  mauveLight: '#E4D4E4',
  amber: '#A67B0A',
  amberLight: '#EFE2BC',

  // Status
  done: '#2D5A3E',
  active: '#C4795B',
  planned: '#EDE8E1',

  // Accent (warm amber — now indicator, active states)
  accent: '#C4795B',

  // Semantic
  danger: '#E53E3E',
  dangerLight: '#FFE4E1',
  // v2 Glass morphism
  glass: {
    bg: 'rgba(255,255,255,0.65)',
    border: 'rgba(255,255,255,0.75)',
    blur: 20,
    sheet: 'rgba(255,255,255,0.85)',
    sheetBlur: 24,
  },

  // v2 Watermark chip
  watermark: {
    text: '#8B4A30',
    bg: 'rgba(181,99,74,0.12)',
  },

  // v2 Category tint opacity for glass pill overlays
  categoryTint: 0.12,
} as const;

// Map category IDs to color pairs
export const categoryColors: Record<string, { solid: string; light: string }> = {
  'sys-deep-work': { solid: colors.primary, light: colors.primaryBg },
  'sys-meetings': { solid: colors.slate, light: colors.slateLight },
  'sys-admin': { solid: colors.muted, light: colors.surface2 },
  'sys-health': { solid: colors.terra, light: colors.terraLight },
  'sys-learning': { solid: colors.mauve, light: colors.mauveLight },
  'sys-personal': { solid: colors.sage, light: colors.sageLight },
  'sys-creative': { solid: colors.amber, light: colors.amberLight },
  'sys-rest': { solid: colors.sage, light: colors.sageLight },
  'cust-social': { solid: colors.amber, light: colors.amberLight },
  'cust-family': { solid: colors.terra, light: colors.terraLight },
  'cust-finance': { solid: colors.primary, light: colors.primaryBg },
  'cust-wedding': { solid: colors.mauve, light: colors.mauveLight },
  'cust-chores': { solid: colors.muted, light: colors.surface2 },
  'cust-explore': { solid: colors.slate, light: colors.slateLight },
  'cust-mumbai': { solid: colors.terra, light: colors.terraLight },
  'cust-fashion': { solid: colors.mauve, light: colors.mauveLight },
  'cust-duniyadari': { solid: colors.slate, light: colors.slateLight },
  'cust-professional': { solid: colors.primary, light: colors.primaryBg },
};

export function getCategoryColor(categoryId: string) {
  return categoryColors[categoryId] ?? { solid: colors.primary, light: colors.primaryBg };
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  screen: 24, // horizontal page padding
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
  pill: 20,
  button: 16,
  card: 16,
  sheet: 24,
} as const;

export const shadows = {
  xs: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  fab: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 16,
  },
  pill: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

// DESIGN.md typography scale
export const typography = {
  display: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  heading: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  headline: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },  // alias for heading
  title: { fontSize: 14, fontWeight: '700' as const },
  body: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  bodySmall: { fontSize: 11, fontWeight: '500' as const, lineHeight: 16 },  // alias for small
  small: { fontSize: 11, fontWeight: '500' as const },
  caption: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.3 },  // Geist Mono
  micro: { fontSize: 9, fontWeight: '600' as const },  // Geist Mono, watermark chips
  mindset: { fontSize: 9.5, fontWeight: '400' as const, fontStyle: 'italic' as const, lineHeight: 13 },
  label: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.3 },
} as const;

// Aliases used across the app (maps to DESIGN.md scale)
export const type = {
  h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '600' as const },
  bodyRegular: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  small: { fontSize: 11, fontWeight: '500' as const },
  caption: { fontSize: 10, fontWeight: '600' as const },
  micro: { fontSize: 9, fontWeight: '600' as const },
  label: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.3 },
} as const;

export const motion = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: { damping: 15, stiffness: 200 },
} as const;

export const sizes = {
  touchTarget: 44,
  iconButton: 40,
  chip: { height: 36, paddingH: 12 },
  card: { paddingV: 12, paddingH: 14, radius: 14, borderLeft: 2 },
  fab: { size: 52, radius: 16 },
  tabBar: { height: 82, paddingBottom: 24 },
} as const;
