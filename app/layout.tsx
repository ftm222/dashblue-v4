import "@/app/globals.css";
import { Outfit } from "next/font/google";
import type { Metadata } from "next";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { PeriodFilterProvider } from "@/providers/PeriodFilterProvider";
import { TVModeProvider } from "@/providers/TVModeProvider";
import { DrillDownProvider } from "@/providers/DrillDownProvider";
import { DataFreshnessProvider } from "@/providers/DataFreshnessProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Dashblue",
  description: "B2B Analytics Control Tower",
};

const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('dashblue:theme') || 'light';
    var r = t;
    if (t === 'system') {
      r = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.classList.add(r);
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${outfit.className} antialiased`}>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <PeriodFilterProvider>
                <TVModeProvider>
                  <DrillDownProvider>
                    <DataFreshnessProvider>
                      <TooltipProvider>{children}</TooltipProvider>
                    </DataFreshnessProvider>
                  </DrillDownProvider>
                </TVModeProvider>
              </PeriodFilterProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
