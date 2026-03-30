// DayFlow Design System — Warm Minimal
// Single source of truth for all visual decisions.
// Every component must source values from here — no hardcoded hex, px, or ms.

// ─── Palette ────────────────────────────────────────────────────────────────

export const colors = {
  // Backgrounds
  bg: '#FAF7F2',          // cream — main screen background
  surface: '#FFFFFF',     // white — cards, sheets
  surface2: '#F2EDE5',    // warm off-white — secondary surfaces, pressed states
  surface3: '#EDE8DF',    // deeper warm — dividers used as surface

  // Text
  text: '#1A1A1A',        // near-black — primary text
  text2: '#4B4642',       // dark warm grey — secondary text
  muted: '#6B6560',       // medium warm grey — captions, placeholders (WCAG AA on white)
  faint: '#9A9490',       // light warm grey — disabled / very secondary

  // Borders & dividers
  border: '#DED6CA',      // warm light border
  divider: '#EDE8E1',     // internal card divider — lighter than border

  // Primary — forest green
  primary: '#2D4A3E',
  primaryHover: '#243D33',  // pressed state
  primaryBg: '#E3ECE6',     // tinted surface for primary context

  // Category palette — all have matching light (bg) variant
  terra: '#B5634A',   terraLight: '#EEDDD4',
  sage: '#5A8C6A',    sageLight: '#D4EADB',
  slate: '#3D5F80',   slateLight: '#CBDCEE',
  mauve: '#7D5A7C',   mauveLight: '#E4D4E4',
  amber: '#A67B0A',   amberLight: '#EFE2BC',

  // Semantic
  danger: '#D93025',       dangerLight: '#FDECEA',
  warning: '#B45309',      warningLight: '#FEF3C7',
  success: '#2D6A4F',      successLight: '#D1FAE5',

  // Status aliases (keep for backward compat with existing components)
  done:    '#2D4A3E',   // = primary
  active:  '#C4795B',  // warm orange for in-progress

  // Overlay
  overlay: 'rgba(26,26,26,0.40)',
  overlayLight: 'rgba(26,26,26,0.12)',
} as const;

// ─── Status tokens ───────────────────────────────────────────────────────────
// Use for activity status chips, dot indicators, and card treatments.

export const statusColors = {
  PLANNED: {
    bg: colors.surface2,
    text: colors.text2,
    dot: colors.border,
    label: 'Planned',
  },
  IN_PROGRESS: {
    bg: '#FFF0E8',
    text: colors.terra,
    dot: colors.terra,
    label: 'In Progress',
  },
  COMPLETED: {
    bg: colors.primaryBg,
    text: colors.primary,
    dot: colors.primary,
    label: 'Done',
  },
  SKIPPED: {
    bg: colors.surface2,
    text: colors.faint,
    dot: colors.faint,
    label: 'Skipped',
  },
  OVERDUE: {
    bg: colors.dangerLight,
    text: colors.danger,
    dot: colors.danger,
    label: 'Overdue',
  },
} as const;

// ─── Category color map ──────────────────────────────────────────────────────

export const categoryColors: Record<string, { solid: string; light: string }> = {
  'sys-deep-work':     { solid: colors.primary, light: colors.primaryBg },
  'sys-meetings':      { solid: colors.slate,   light: colors.slateLight },
  'sys-admin':         { solid: colors.muted,   light: colors.surface2 },
  'sys-health':        { solid: colors.terra,   light: colors.terraLight },
  'sys-learning':      { solid: colors.mauve,   light: colors.mauveLight },
  'sys-personal':      { solid: colors.sage,    light: colors.sageLight },
  'sys-creative':      { solid: colors.amber,   light: colors.amberLight },
  'sys-rest':          { solid: colors.sage,    light: colors.sageLight },
  'cust-social':       { solid: colors.amber,   light: colors.amberLight },
  'cust-family':       { solid: colors.terra,   light: colors.terraLight },
  'cust-finance':      { solid: colors.primary, light: colors.primaryBg },
  'cust-wedding':      { solid: colors.mauve,   light: colors.mauveLight },
  'cust-chores':       { solid: colors.muted,   light: colors.surface2 },
  'cust-explore':      { solid: colors.slate,   light: colors.slateLight },
  'cust-mumbai':       { solid: colors.terra,   light: colors.terraLight },
  'cust-fashion':      { solid: colors.mauve,   light: colors.mauveLight },
  'cust-duniyadari':   { solid: colors.slate,   light: colors.slateLight },
  'cust-professional': { solid: colors.primary, light: colors.primaryBg },
};

export function getCategoryColor(categoryId: string) {
  return categoryColors[categoryId] ?? { solid: colors.primary, light: colors.primaryBg };
}

// ─── Spacing (4px base grid) ─────────────────────────────────────────────────

export const spacing = {
  xs:     4,
  sm:     8,
  md:     12,
  lg:     16,
  xl:     24,
  xxl:    32,
  xxxl:   48,
  screen: 20,  // horizontal page padding
} as const;

// ─── Border radius ───────────────────────────────────────────────────────────

export const radii = {
  xs:     6,
  sm:     10,
  md:     14,
  lg:     16,
  xl:     20,
  pill:   999,
  button: 14,
  card:   16,
  sheet:  24,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────
// Use xs for subtle depth, sm for cards, md for elevated cards, fab for FABs.

export const shadows = {
  none: {
    shadowOpacity: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },
  card: {
    shadowColor: '#2D4A3E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  lifted: {
    shadowColor: '#2D4A3E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  fab: {
    shadowColor: '#2D4A3E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
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
} as const;

// ─── Typography scale ────────────────────────────────────────────────────────
// Use `text.*` for ALL text styles. Never set fontSize/fontWeight inline.

export const text = {
  // Display / Screen titles
  display:     { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.8, lineHeight: 38 },
  screenTitle: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5, lineHeight: 34 },
  pageTitle:   { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 28 },

  // Section & card headers
  sectionTitle: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  cardTitle:    { fontSize: 15, fontWeight: '600' as const, lineHeight: 20 },
  rowTitle:     { fontSize: 14, fontWeight: '500' as const, lineHeight: 19 },

  // Body
  body:     { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyMd:   { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySm:   { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },

  // Labels & meta — DO NOT use textTransform:'uppercase' (Android bug), use letterSpacing only
  label:    { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8, lineHeight: 16 },
  meta:     { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  caption:  { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.2, lineHeight: 15 },
  micro:    { fontSize: 10, fontWeight: '500' as const, letterSpacing: 0.3, lineHeight: 14 },

  // Special
  tabLabel: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.2 },
  numeric:  { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
} as const;

// ─── Motion ───────────────────────────────────────────────────────────────────

export const motion = {
  // Durations (ms)
  instant: 100,
  fast:    150,
  normal:  250,
  slow:    400,

  // Spring presets for react-native-reanimated / Animated
  springSnap:   { damping: 20, stiffness: 300 },  // tight, no bounce
  spring:       { damping: 15, stiffness: 200 },  // default
  springBouncy: { damping: 10, stiffness: 160 },  // slight bounce

  // Easing labels (use with withTiming)
  easeOut: 'easeOut' as const,
} as const;

// ─── Sizes ────────────────────────────────────────────────────────────────────

export const sizes = {
  touchTarget: 44,          // minimum tappable area (WCAG)
  iconButton:  40,
  chip:        { height: 36, paddingH: 14 },
  card:        { paddingV: 16, paddingH: 16, radius: 16, borderLeft: 3 },
  fab:         { size: 52, radius: 26 },
  tabBar:      { height: 80, paddingBottom: 24 },
  input:       { height: 48, paddingH: 14, borderRadius: 12, borderWidth: 1.5 },
  avatar:      { sm: 28, md: 36, lg: 48 },
} as const;

// ─── Component presets ────────────────────────────────────────────────────────
// Spread these into StyleSheet.create() to ensure consistency.
// e.g.  container: { ...ui.screenContainer }

export const ui = {
  // Screen-level
  screenContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screenHeader: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  screenTitle: {
    color: colors.text,
    ...text.screenTitle,
  },

  // Section labels (the small uppercase-style dividers between content groups)
  sectionLabel: {
    color: colors.muted,
    ...text.label,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  // Cards
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: sizes.card.paddingV,
    ...shadows.card,
  },
  cardAccent: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: sizes.card.paddingV,
    borderLeftWidth: sizes.card.borderLeft,
    ...shadows.card,
  },

  // Row inside a card
  cardRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  cardRowLast: {
    borderBottomWidth: 0,
  },

  // Buttons
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: sizes.touchTarget,
    ...shadows.sm,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    ...text.cardTitle,
    letterSpacing: 0.2,
  },
  secondaryButton: {
    backgroundColor: colors.primaryBg,
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: sizes.touchTarget,
  },
  secondaryButtonText: {
    color: colors.primary,
    ...text.meta,
    fontWeight: '600' as const,
  },
  ghostButton: {
    backgroundColor: colors.surface2,
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: sizes.touchTarget,
  },
  ghostButtonText: {
    color: colors.text2,
    ...text.meta,
    fontWeight: '600' as const,
  },

  // Text input
  input: {
    backgroundColor: colors.surface,
    borderRadius: sizes.input.borderRadius,
    borderWidth: sizes.input.borderWidth,
    borderColor: colors.border,
    paddingHorizontal: sizes.input.paddingH,
    minHeight: sizes.input.height,
    color: colors.text,
    ...text.body,
  },

  // Pill / badge
  pill: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: spacing.xxl,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyStateTitle: {
    color: colors.text,
    ...text.sectionTitle,
    textAlign: 'center' as const,
    marginBottom: spacing.sm,
  },
  emptyStateBody: {
    color: colors.muted,
    ...text.body,
    textAlign: 'center' as const,
    lineHeight: 22,
  },

  // Loading container
  loading: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // Divider line
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },

  // Checkbox (22px hit area expanded to 44px via hitSlop)
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  checkboxDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800' as const,
  },
} as const;

// ─── Backward-compatible aliases ──────────────────────────────────────────────
// Keep old exports so existing code doesn't break while we migrate.

/** @deprecated Use `text.*` instead */
export const typography = {
  displayLarge: text.display,
  headline:     text.pageTitle,
  title:        text.sectionTitle,
  body:         text.body,
  bodySmall:    text.bodySm,
  label:        text.meta,
  caption:      text.caption,
} as const;

/** @deprecated Use `text.*` instead */
export const type = {
  h1:          text.screenTitle,
  h2:          text.pageTitle,
  h3:          text.sectionTitle,
  body:        text.cardTitle,
  bodyRegular: text.body,
  small:       text.bodySm,
  caption:     text.meta,
  micro:       text.caption,
  label:       text.meta,
} as const;

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Returns an uppercase string safely (works on Android unlike textTransform:'uppercase').
 * Use for all section label strings.
 */
export function upperLabel(str: string): string {
  return str.toUpperCase();
}

/**
 * Returns a hex color with opacity applied (0–1).
 * e.g. withAlpha(colors.primary, 0.1) → rgba equivalent
 */
export function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Returns statusColors entry for a given activity status string.
 */
export function getStatusColor(status: string) {
  return statusColors[status as keyof typeof statusColors] ?? statusColors.PLANNED;
}
