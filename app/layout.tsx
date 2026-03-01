import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});
export const metadata: Metadata = {
    title: "Isaiah Thomas | Photographer & Scholar",
    description: "Portfolio of Isaiah Thomas, photographer and emerging scholar based in DFW.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.variable} font-sans antialiased w-screen min-h-screen`}>
                {children}
            </body>
        </html>
    );
}
