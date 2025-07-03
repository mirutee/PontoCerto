
'use client';

import Link from "next/link"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Fingerprint } from "lucide-react"
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { format, addMonths } from "date-fns";

export default function SignupPage() {
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!companyName || !cnpj || !email || !password) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.'
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: companyName,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Falha ao criar o usuário na autenticação.");
      
      const userId = authData.user.id;

      // Do not store the password in the database. Supabase Auth handles it.
      const { error: profileError } = await supabase
        .from('usuarios')
        .insert({
          id: userId,
          nome: companyName,
          email,
          tipo: 'empresa',
          cnpj: cnpj,
        });

      if (profileError) throw profileError;

      const { error: companyError } = await supabase
        .from('empresas')
        .insert({
          nome: companyName,
          cnpj: cnpj,
          plano_id: 1, // Default to Básico plan
          status_pagamento: 'Pendente',
          vigencia: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
        });
      
      if (companyError) throw companyError;
      
      toast({
        title: 'Cadastro quase concluído!',
        description: 'Enviamos um e-mail de confirmação para você. Por favor, verifique sua caixa de entrada e spam.',
        duration: 9000,
      });
      
      router.push('/login');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro no cadastro',
        description: error.message || 'Não foi possível criar a conta. O email ou CNPJ podem já estar em uso.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
     <main className="flex items-center justify-center min-h-screen bg-muted/40">
        <Card className="mx-auto max-w-sm">
            <CardHeader className="text-center">
                <Link href="/" className="inline-block mb-4">
                    <Fingerprint className="h-10 w-10 text-primary mx-auto" />
                </Link>
                <CardTitle className="text-2xl">Cadastro da Empresa</CardTitle>
                <CardDescription>
                    Crie sua conta para contratar um plano. O acesso será liberado após a confirmação do pagamento.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSignup} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="company-name">Nome da Empresa</Label>
                        <Input id="company-name" placeholder="Sua Empresa LTDA" required value={companyName} onChange={e => setCompanyName(e.target.value)} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="cpf-cnpj">CPF ou CNPJ</Label>
                        <Input id="cpf-cnpj" placeholder="Seu CPF ou CNPJ" required value={cnpj} onChange={e => setCnpj(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email de Contato</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="contato@suaempresa.com"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Crie uma Senha</Label>
                        <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                       {isLoading ? 'Registrando...' : 'Registrar Empresa'}
                    </Button>
                </form>
                <div className="mt-4 text-center text-sm">
                    Já tem uma conta?{" "}
                    <Link href="/login" className="underline">
                        Entrar
                    </Link>
                </div>
            </CardContent>
        </Card>
    </main>
  )
}
