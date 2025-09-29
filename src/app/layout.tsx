// app/layout.tsx
import './globals.css'; // Optional: global styles
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: '3D Avatar Audio Visualizer',
  description: 'Avatar with morph target animation based on audio input',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}
