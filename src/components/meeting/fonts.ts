// The display serif for the meeting and end screens: a Didone, for the
// record-sleeve look (brand, suggested reply, end-screen headline). Body text
// stays Geist from the layout. page.tsx and EndScreen both apply it.
import { Bodoni_Moda } from "next/font/google";

export const display = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
