export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="flex-1" />
      {children}
      <footer className="pb-8 text-center text-xs">
        <p className="text-gradient-red font-semibold">A creation of Alexander Morenov & S/F Technologies</p>
        <p className="mt-1 text-gradient-red">29 Bringelly Ave, Pendle Hill, Sydney NSW, Australia</p>
        <p className="mt-1 text-gradient-red">aonequantumoracleai@gmail.com | +61 420 922 489</p>
      </footer>
    </div>
  );
}
