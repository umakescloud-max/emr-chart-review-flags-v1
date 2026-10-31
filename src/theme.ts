import type { Palette, Typefaces } from "@kit";

// Starter placeholder only — a real build replaces this with the brief's
// design.palette / design.typefaces. The builder may never touch this file
// once a brief has been applied (see builder.md's "theme" constraint).
export const theme: { palette: Palette; typefaces: Typefaces } = {
  palette: {
    surface: "#F4F6F3",
    ink: "#1F2A24",
    primary: "#2F5D50",
    accent: "#C98A2C",
    muted: "#5E6B64",
  },
  typefaces: {
    heading: "Source Serif 4",
    body: "Public Sans",
  },
};
