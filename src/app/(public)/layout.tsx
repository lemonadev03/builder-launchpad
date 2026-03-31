export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </main>
  );
}
