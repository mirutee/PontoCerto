"use client";
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import SidebarNav from '@/components/layout/sidebar-nav';
import Header from '@/components/layout/header';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkUserStatus = async () => {
      // This check is only for employees
      if (sessionStorage.getItem('userRole') !== 'employee') {
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return; // Not logged in, no need to check
      }

      const { data: employee, error } = await supabase
        .from('funcionarios')
        .select('status')
        .eq('id', session.user.id)
        .single();
      
      const isInactive = !employee || error || employee.status === 'Inativo';

      if (isInactive) {
        toast({ 
          variant: 'destructive', 
          title: 'Acesso Revogado', 
          description: 'Sua conta foi desativada ou não foi encontrada. Faça o login novamente.' 
        });
        await supabase.auth.signOut();
        sessionStorage.clear();
        router.push('/login');
      }
    };

    // Run the check on every navigation
    if (!noLayoutRoutes.includes(pathname)) {
      checkUserStatus();
    }
  }, [pathname, router, toast]);
  
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
