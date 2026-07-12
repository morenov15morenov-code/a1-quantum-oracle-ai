import { Navbar } from "@/components/layout/navbar";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main-content" className="flex-1 px-4 py-6 md:px-6">{children}</main>
    </div>
  );
}
