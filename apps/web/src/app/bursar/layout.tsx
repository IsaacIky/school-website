import { AuthProvider } from '@/contexts/AuthContext';
import { PortalSidebar } from '@/components/portal/PortalSidebar';

export default function BursarPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-[#F7F8FC]">
        <PortalSidebar portalKey="bursar" />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </AuthProvider>
  );
}
