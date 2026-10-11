// The display serif, the same Didone the meeting screen uses for its
// record-sleeve look (track B, components/meeting/fonts.ts). Loaded here too
// so landing and prep do not depend on a file another track owns.
import { Bodoni_Moda } from "next/font/google";

export const display = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
