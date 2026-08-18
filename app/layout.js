import { Playfair_Display, DM_Sans, Russo_One, Exo_2 } from "next/font/google"; // How to import fonts
import "./globals.css";

// To add in fonts
// If you don't want size or weight, don't include them
// Only put in variavle and subsets at least as the baseline
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"]
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"]
})

const russoOne = Russo_One({
  variable: "--font-russo",
  subsets: ["latin"],
  weight: ["400"]
});

const exo2 = Exo_2({
  variable: "--font-exo",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"]
});

// metadata export is Next.js's way of setting the page <title> 
// and meta description without you touching <head> by hand
export const metadata = {
  title: "Roam",
  description: "Find the places locals actually love"
};

// The children prop links to page.js content into it
export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} ${russoOne.variable} ${exo2.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <main id="page-root" className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
