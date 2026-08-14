import { Sidebar } from "@/components/layout/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main id="main-content" className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
    </div>
  );
}
