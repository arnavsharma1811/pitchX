

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="mona_sans antialiased pattern">
        {children}
      </body>
    </html>
  );
}