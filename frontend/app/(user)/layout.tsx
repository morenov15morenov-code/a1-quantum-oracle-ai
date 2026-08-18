import { Navbar } from "@/components/layout/navbar";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main-content" className="flex-1 px-4 py-6 md:px-6">{children}</main>
      <footer className="pb-6 text-center text-xs font-semibold text-black">
        <p>A creation of Alexander Morenov & S/F Technologies</p>
        <p className="mt-1">29 Bringelly Ave, Pendle Hill, Sydney NSW, Australia</p>
        <p className="mt-1">aonequantumoracleai@gmail.com | +61 420 922 489</p>
      </footer>
    </div>
  );
}
