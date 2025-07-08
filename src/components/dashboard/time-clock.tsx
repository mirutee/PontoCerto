'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowUpCircle, ArrowDownCircle, Fingerprint, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../ui/label';

export default function TimeClock() {
  const [time, setTime] = useState<Date | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);
  const { toast } = useToast();

  const [isAuthPending, setIsAuthPending] = useState(false);
  const [authAttempts, setAuthAttempts] = useState(0);
  const [isJustificationDialogOpen, setIsJustificationDialogOpen] = useState(false);
  const [justification, setJustification] = useState('');
  const [clockInNotes, setClockInNotes] = useState('');

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = (note?: string) => {
    setIsCheckedIn(true);
    setLastCheckIn(new Date());
    setAuthAttempts(0);
    if (note) {
      setClockInNotes(note);
      toast({ title: 'Entrada Registrada com Justificativa' });
    } else {
      toast({ title: 'Entrada Registrada com Sucesso' });
    }
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    setClockInNotes('');
  };

  const handleBiometricAuth = async () => {
    if (authAttempts >= 3) {
      setIsJustificationDialogOpen(true);
      return;
    }

    setIsAuthPending(true);
    // Simulação da API de Autenticação Web (WebAuthn)
    try {
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          // Simula sucesso em ~70% das vezes
          if (Math.random() > 0.3) {
            resolve();
          } else {
            reject(new Error('Falha na autenticação biométrica.'));
          }
        }, 1500);
      });
      handleCheckIn();
    } catch (error) {
      const newAttempts = authAttempts + 1;
      setAuthAttempts(newAttempts);
      if (newAttempts >= 3) {
        toast({
          variant: 'destructive',
          title: 'Muitas Tentativas Falharam',
          description: 'Por favor, registre a entrada com uma justificativa.',
        });
        setIsJustificationDialogOpen(true);
      } else {
        toast({
          variant: 'destructive',
          title: 'Falha na Autenticação',
          description: `Tente novamente. Tentativa ${newAttempts} de 3.`,
        });
      }
    } finally {
      setIsAuthPending(false);
    }
  };

  const handleJustificationSubmit = () => {
    if (justification.trim().length < 10) {
      toast({
        variant: 'destructive',
        title: 'Justificativa Inválida',
        description: 'A justificativa precisa ter pelo menos 10 caracteres.',
      });
      return;
    }
    handleCheckIn(justification);
    setIsJustificationDialogOpen(false);
    setJustification('');
  };

  if (!time) {
    return (
      <Card className="lg:col-span-1 flex flex-col justify-center items-center">
        <CardHeader>
          <CardTitle>Carregando Relógio de Ponto...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="lg:col-span-1 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Relógio de Ponto</CardTitle>
          <CardDescription className="text-xs">
            {time.toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow justify-center items-center gap-4">
          <div className="text-4xl font-bold tracking-tighter">
            {time.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </div>

          {lastCheckIn && (
            <p className="text-sm text-muted-foreground">
              {isCheckedIn ? 'Chegada registrada às' : 'Última chegada às'}{' '}
              {lastCheckIn.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}

          {isCheckedIn ? (
            <Button onClick={handleCheckOut} variant="destructive" className="w-full">
              <ArrowDownCircle />
              Registrar Saída
            </Button>
          ) : (
            <Button onClick={handleBiometricAuth} className="w-full bg-green-600 hover:bg-green-700 text-primary-foreground" disabled={isAuthPending}>
              {isAuthPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ArrowUpCircle />
              )}
              {isAuthPending ? 'Autenticando...' : 'Registrar Chegada'}
            </Button>
          )}
          <Textarea
            placeholder={isCheckedIn ? "Anotações ou justificativa de saída..." : "Anotações opcionais para hoje..."}
            className="text-sm mt-2"
            rows={2}
            value={clockInNotes}
            readOnly={!isCheckedIn}
          />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Fingerprint className="h-3 w-3" />
              <span>Autenticação biométrica ativada</span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isJustificationDialogOpen} onOpenChange={setIsJustificationDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registro Manual de Entrada</DialogTitle>
            <DialogDescription>
              A autenticação biométrica falhou. Por favor, forneça uma justificativa para registrar sua entrada.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="justification">Justificativa (obrigatória)</Label>
              <Textarea
                id="justification"
                placeholder="Ex: A câmera do celular não está funcionando."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJustificationDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleJustificationSubmit}>Enviar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
