import { Sidebar } from "@/components/layout/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <main id="main-content" className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
        <footer className="pb-6 text-center text-xs">
          <p className="text-gradient font-semibold">A creation of Alexander Morenov & S/F Technologies</p>
          <p className="mt-1 text-gradient">29 Bringelly Ave, Pendle Hill, Sydney NSW, Australia</p>
          <p className="mt-1 text-gradient">aonequantumoracleai@gmail.com | +61 420 922 489</p>
        </footer>
      </div>
    </div>
  );
}
