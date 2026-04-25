export default function AppShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={`h-dvh flex flex-col gap-2 px-3 py-3 text-white ${className}`}>
      {children}
    </main>
  );
}
