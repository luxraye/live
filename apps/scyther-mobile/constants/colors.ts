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
    text: '#EBEBE8', // Classic Linen
    tint: '#E11D48', // Crimson Red

    // Core surfaces
    background: '#000000', // Jet Black
    foreground: '#EBEBE8',

    // Cards / elevated surfaces
    card: '#0D1117',
    cardForeground: '#EBEBE8',

    // Primary action color (buttons, links, active states)
    primary: '#E11D48', // Crimson Red
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#161B22',
    secondaryForeground: '#EBEBE8',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#1F242C',
    mutedForeground: '#8B949E',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#1E1218',
    accentForeground: '#E11D48',

    // Destructive actions (delete, error states)
    destructive: '#E11D48',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#21262D',
    input: '#161B22',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;
