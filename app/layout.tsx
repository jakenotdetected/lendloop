import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Bricolage_Grotesque } from "next/font/google";
import type { ReactNode } from "react";
import { ConvexClientProvider } from "./ConvexClientProvider";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-display",
  display: "swap",
});
const body = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "LendLoop",
  description: "Borrow what you need. Lend what you don't.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body>
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#1d2433",
              colorForeground: "#1d2433",
              borderRadius: "12px",
              fontSize: "1rem",
              fontFamily: "var(--font-body)",
            },
            elements: {
                rootBox: { width: "100%", maxWidth: "500px" },
                cardBox: { width: "100%", maxWidth: "500px" },
                card: { padding: "40px 36px" },
                headerTitle: {
                  fontFamily: "var(--font-display)",
                  fontSize: "1.7rem",
                  fontWeight: 800,
                },
                headerSubtitle: { fontSize: "1.02rem" },
                socialButtonsBlockButton: { minHeight: "54px", fontSize: "1.02rem" },
                socialButtonsBlockButtonText: { fontSize: "1.02rem", fontWeight: 700 },
                dividerText: { fontSize: "0.95rem" },
                formFieldLabel: { fontSize: "1rem", fontWeight: 700 },
                formFieldInput: { minHeight: "54px", fontSize: "1.05rem", padding: "12px 16px" },
                formButtonPrimary: { minHeight: "54px", fontSize: "1.05rem", fontWeight: 700 },
                footerActionText: { fontSize: "1rem" },
                footerActionLink: { fontSize: "1rem", fontWeight: 700 },
            },
          }}
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
