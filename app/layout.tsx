import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'sans-serif',
          background: '#f4f1ea',
          color: '#1d1d1d',
        }}
      >
        {children}
      </body>
    </html>
  );
}
