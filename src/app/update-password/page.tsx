'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
import Link from 'next/link';
import { Fingerprint } from 'lucide-react';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Senha muito curta',
        description: 'Sua senha deve ter pelo menos 6 caracteres.',
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Senhas não coincidem',
        description: 'Por favor, verifique se as senhas são iguais.',
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao definir a senha',
        description: error.message,
      });
    } else {
      toast({
        title: 'Senha definida com sucesso!',
        description: 'Agora você pode entrar na sua conta com a nova senha.',
      });
      await supabase.auth.signOut();
      router.push('/login');
    }

    setIsLoading(false);
  };

  if (!isClient) {
    return null; // Render nothing on the server to prevent hydration errors
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <Link href="/" className="inline-block mb-4">
                <Fingerprint className="h-10 w-10 text-primary mx-auto" />
            </Link>
            <CardTitle className="text-2xl">Crie sua Senha</CardTitle>
            <CardDescription>
                Você foi convidado para o PontoCerto. Defina uma senha para finalizar seu cadastro.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
