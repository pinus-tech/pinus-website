import AdminShellHeader from "@/app/components/admin/AdminShellHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-900">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage: `radial-gradient(at 0% 0%, rgb(99 102 241 / 0.12) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgb(139 92 246 / 0.1) 0px, transparent 45%)`,
        }}
        aria-hidden
      />
      <AdminShellHeader />
      {children}
    </div>
  );
}
