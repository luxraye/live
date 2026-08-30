/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#F0F6FF',
    tint: '#DC2626',

    // Core surfaces
    background: '#060912',
    foreground: '#F0F6FF',

    // Cards / elevated surfaces
    card: '#111827',
    cardForeground: '#F0F6FF',

    // Primary action color (buttons, links, active states)
    primary: '#DC2626',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#18243A',
    secondaryForeground: '#F0F6FF',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#18243A',
    mutedForeground: '#8B9DB5',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#0A2B35',
    accentForeground: '#67E8F9',

    // Destructive actions (delete, error states)
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#1E2D45',
    input: '#1E2D45',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;
