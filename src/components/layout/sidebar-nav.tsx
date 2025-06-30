'use client';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Settings,
  Briefcase,
  User,
  Fingerprint,
  Building,
  Users,
  FileArchive,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';

const employeeLinks = [
  { href: '/dashboard', label: 'Meu Painel', icon: LayoutDashboard },
  { href: '/absences', label: 'Solicitar Ausência', icon: Briefcase },
  { href: '/calendar', label: 'Meu Calendário', icon: Calendar },
  { href: '/documents', label: 'Meus Documentos', icon: FileArchive },
];

const companyLinks = [
    { href: '/company', label: 'Painel da Empresa', icon: Building },
    { href: '/reports', label: 'Relatórios', icon: FileText },
];

const adminLinks = [
    { href: '/admin', label: 'Admin de Empresas', icon: Users },
]


export default function SidebarNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs on the client after the component mounts
    // to prevent hydration mismatch errors.
    const userRole = sessionStorage.getItem('userRole');
    setRole(userRole);
  }, []);

  // Don't render anything until the role is determined on the client
  // to avoid showing the wrong navigation links.
  if (role === null) {
    return null; 
  }

  const getLinks = () => {
      if (role === 'company') return companyLinks;
      if (role === 'admin') return adminLinks;
      // Default to employee if role is not set or is something else
      return employeeLinks;
  }

  const links = getLinks();


  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2" data-ai-hint="logo fingerprint">
          <Fingerprint className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold">PontoCerto</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {links.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(link.href)}
                tooltip={link.label}
              >
                <Link href={link.href}>
                  <link.icon />
                  <span>{link.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Configurações" isActive={pathname.startsWith('/settings')}>
              <Link href="/settings">
                <Settings />
                <span>Configurações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Perfil do Usuário">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src="https://placehold.co/100x100.png"
                  alt="User"
                  data-ai-hint="person portrait"
                />
                <AvatarFallback>
                  <User />
                </AvatarFallback>
              </Avatar>
              <span className="flex flex-col text-left">
                <span className="font-semibold">Usuário Logado</span>
                <span className="text-xs text-muted-foreground">
                  usuario@pontocerto.com
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
