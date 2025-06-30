'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Fingerprint } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [companyCpfCnpj, setCompanyCpfCnpj] = useState('');
  const [companyPassword, setCompanyPassword] = useState('');
  const [employeeIdentifier, setEmployeeIdentifier] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeIdentifier || !employeePassword) {
      toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Por favor, preencha o email/CPF e a senha.' });
      return;
    }

    let userEmail = '';
    const isEmail = employeeIdentifier.includes('@');

    try {
      if (isEmail) {
        userEmail = employeeIdentifier;
      } else {
        // Assume it's a CPF
        const { data: userProfile, error: profileError } = await supabase
          .from('usuarios')
          .select('email')
          .eq('cnpj', employeeIdentifier) // Assuming CPF is stored in 'cnpj' for employees
          .eq('tipo', 'funcionario')
          .single();
        
        if (profileError || !userProfile || !userProfile.email) {
          toast({ variant: 'destructive', title: 'Falha no Login', description: 'Funcionário não encontrado ou CPF inválido.' });
          return;
        }
        userEmail = userProfile.email;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: employeePassword,
      });

      if (authError) {
        if (authError.message === 'Email not confirmed') {
          toast({
            variant: 'destructive',
            title: 'Email não confirmado',
            description: 'Por favor, verifique sua caixa de entrada para o e-mail de confirmação.',
            duration: 9000,
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Falha no Login',
            description: 'Credenciais inválidas. Verifique seus dados.',
          });
        }
        return;
      }
      
      const { user } = authData;
      if (!user) {
        toast({ variant: 'destructive', title: 'Falha no Login', description: 'Não foi possível autenticar o usuário.' });
        return;
      }

      // Final check to ensure user is an employee and get company details
      const { data: employeeRecord, error: employeeError } = await supabase
        .from('funcionarios')
        .select('*, empresas(status_pagamento)')
        .eq('id', user.id)
        .single();
      
      if (employeeError || !employeeRecord) {
        toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Este usuário não está registrado como um funcionário ativo.' });
        await supabase.auth.signOut();
        return;
      }

      const companyStatus = employeeRecord.empresas?.status_pagamento;
      if (companyStatus !== 'Pago') {
        toast({ variant: 'destructive', title: 'Acesso da Empresa Pendente', description: 'A sua empresa não está com o pagamento ativo. Contate o administrador.' });
        await supabase.auth.signOut();
        return;
      }

      sessionStorage.setItem('userRole', 'employee');
      sessionStorage.setItem('userId', user.id);
      router.push('/dashboard');

    } catch (error: any) {
      console.error("Failed to process employee login", error);
      toast({ variant: 'destructive', title: 'Erro', description: error.message || 'Ocorreu um erro ao tentar fazer o login.' });
    }
  };

  const handleCompanyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyCpfCnpj || !companyPassword) {
      toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Por favor, preencha o CPF/CNPJ e a senha.' });
      return;
    }
    
    try {
      const { data: userProfile, error: profileError } = await supabase
        .from('usuarios')
        .select('email, id')
        .eq('cnpj', companyCpfCnpj)
        .eq('tipo', 'empresa')
        .single();
      
      if (profileError || !userProfile || !userProfile.email) {
        toast({ variant: 'destructive', title: 'Falha no Login', description: 'Empresa não encontrada ou CNPJ inválido.' });
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userProfile.email,
        password: companyPassword,
      });

      if (authError) {
        if (authError.message === 'Email not confirmed') {
          toast({
            variant: 'destructive',
            title: 'Email não confirmado',
            description: 'Por favor, verifique sua caixa de entrada (e spam) para o e-mail de confirmação.',
            duration: 9000,
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Falha no Login',
            description: 'Credenciais inválidas. Verifique seus dados.',
          });
        }
        return;
      }
      
      const { data: company, error: companyError } = await supabase
        .from('empresas')
        .select('status_pagamento')
        .eq('cnpj', companyCpfCnpj)
        .single();
      
      if (companyError || !company) {
         toast({ variant: 'destructive', title: 'Erro de Dados', description: 'Não foi possível encontrar os detalhes da empresa.' });
         await supabase.auth.signOut();
         return;
      }

      if (company.status_pagamento !== 'Pago') {
        toast({ variant: 'destructive', title: 'Acesso Pendente', description: 'O acesso desta empresa ainda não foi liberado pelo administrador.' });
        await supabase.auth.signOut();
        return;
      }

      sessionStorage.setItem('userRole', 'company');
      sessionStorage.setItem('userId', userProfile.id);
      router.push('/company');

    } catch (error: any) {
      console.error("Failed to process company login", error);
      toast({ variant: 'destructive', title: 'Erro', description: error.message || 'Ocorreu um erro ao tentar fazer o login.' });
    }
  };


  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o email e a senha.',
      });
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });

      if (authError) {
        if (authError.message === 'Email not confirmed') {
           toast({
              variant: 'destructive',
              title: 'Email não confirmado',
              description: 'Por favor, verifique sua caixa de entrada (e spam) e clique no link de confirmação.',
              duration: 9000,
            });
        } else {
            toast({
              variant: 'destructive',
              title: 'Falha no Login',
              description: 'Credenciais inválidas. Verifique seu e-mail e senha.',
            });
        }
        return;
      }
      
      if (!authData.user) {
         toast({
              variant: 'destructive',
              title: 'Falha no Login',
              description: 'Não foi possível autenticar o usuário.',
            });
          return;
      }

      const userId = authData.user.id;
      const userEmail = authData.user.email;

      // Check if a profile exists for this admin user
      const { data: userProfile, error: profileError } = await supabase
        .from('usuarios')
        .select('tipo, id')
        .eq('id', userId)
        .single();
      
      // Handle potential DB errors, but ignore the "row not found" error because we'll create it.
      if (profileError && profileError.code !== 'PGRST116') {
        toast({ variant: 'destructive', title: 'Erro de Banco de Dados', description: `Falha ao consultar perfil: ${profileError.message}` });
        await supabase.auth.signOut();
        return;
      }
      
      // If a profile exists, check its type
      if (userProfile) {
        if (userProfile.tipo !== 'admin') {
          toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Este usuário não possui permissões de administrador.' });
          await supabase.auth.signOut();
          return;
        }
      } else {
        // If profile does not exist, create it on-the-fly for the admin.
        const { error: newProfileError } = await supabase
          .from('usuarios')
          .insert({
            id: userId,
            email: userEmail,
            nome: 'Administrador Master', // Assign a default name
            tipo: 'admin'
          });

        if (newProfileError) {
          toast({ variant: 'destructive', title: 'Falha ao Configurar Perfil', description: `Não foi possível criar o perfil de admin: ${newProfileError.message}` });
          await supabase.auth.signOut();
          return;
        }
      }

      // If we've reached here, the user is a valid admin.
      sessionStorage.setItem('userRole', 'admin');
      sessionStorage.setItem('userId', userId);
      router.push('/admin');

    } catch (error: any) {
      console.error("Failed to process admin login", error);
      toast({
        variant: 'destructive',
        title: 'Erro Inesperado',
        description: 'Ocorreu um erro inesperado ao tentar fazer o login.',
      });
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-muted/40">
      <Tabs defaultValue="employee" className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mb-4">
            <Fingerprint className="h-10 w-10 text-primary mx-auto" />
          </Link>
          <CardTitle className="text-2xl">Entrar na sua Conta</CardTitle>
          <CardDescription>
            Selecione seu perfil para acessar a plataforma.
          </CardDescription>
        </CardHeader>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="employee">Funcionário</TabsTrigger>
          <TabsTrigger value="company">Empresa</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>
        <TabsContent value="employee">
          <Card>
            <CardHeader>
              <CardTitle>Login do Funcionário</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmployeeLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier-employee">Email ou CPF</Label>
                  <Input
                    id="identifier-employee"
                    type="text"
                    placeholder="seu@email.com ou 123.456.789-00"
                    required
                    value={employeeIdentifier}
                    onChange={(e) => setEmployeeIdentifier(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-employee">Senha</Label>
                  <Input 
                    id="password-employee" 
                    type="password" 
                    required 
                    value={employeePassword}
                    onChange={(e) => setEmployeePassword(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember-me" />
                  <Label htmlFor="remember-me" className="font-normal">
                    Lembrar-me
                  </Label>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                >
                  Entrar
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Login da Empresa</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompanyLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf-cnpj">CPF ou CNPJ</Label>
                  <Input 
                    id="cpf-cnpj" 
                    placeholder="Seu CPF ou CNPJ" 
                    required 
                    value={companyCpfCnpj}
                    onChange={(e) => setCompanyCpfCnpj(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-company">Senha</Label>
                  <Input 
                    id="password-company" 
                    type="password" 
                    required 
                    value={companyPassword}
                    onChange={(e) => setCompanyPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                >
                  Entrar
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle>Login do Administrador</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-admin">Email</Label>
                  <Input
                    id="email-admin"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@email.com"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-admin">Senha</Label>
                  <Input
                    id="password-admin"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Entrar
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <div className="mt-4 text-center text-sm">
          Não tem uma conta?{' '}
          <Link href="/signup" className="underline">
            Cadastre sua empresa
          </Link>
        </div>
      </Tabs>
    </main>
  );
}
