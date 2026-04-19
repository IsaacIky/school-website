import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'University Platform',
  description: 'DB-configurable multi-campus university platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F7F8FC] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
