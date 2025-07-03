"use client";
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import SidebarNav from '@/components/layout/sidebar-nav';
import Header from '@/components/layout/header';
import { usePathname } from 'next/navigation';

const titles: { [key: string]: string } = {
  '/dashboard': 'Painel do Funcionário',
  '/absences': 'Gestão de Ausências',
  '/calendar': 'Calendário de Ocorrências',
  '/documents': 'Central de Documentos',
  '/reports': 'Relatórios',
  '/settings': 'Configurações',
  '/admin': 'Painel do Administrador',
  '/company': 'Painel da Empresa',
};

const noLayoutRoutes = ['/', '/login', '/signup', '/update-password'];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (noLayoutRoutes.includes(pathname)) {
    return <div className="bg-background">{children}</div>;
  }
  
  const title = titles[pathname] || 'PontoCerto';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarNav />
        </Sidebar>
        <div className="flex-1 flex flex-col min-h-screen">
          <Header title={title} />
          <main className="flex-1 p-4 md:p-6 bg-muted/40">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
