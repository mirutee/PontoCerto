'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowDownCircle,
  Loader2,
  Video,
  VideoOff,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../ui/label';

export default function TimeClock() {
  const [time, setTime] = useState<Date | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);
  const { toast } = useToast();

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isJustificationDialogOpen, setIsJustificationDialogOpen] = useState(false);
  const [justification, setJustification] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clock update effect
  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Camera permission effect
  useEffect(() => {
    const getCameraPermission = async () => {
      // Check if running in a browser environment
      if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Câmera não suportada',
          description: 'Seu navegador ou ambiente não suporta acesso à câmera.',
        });
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        
        let title = 'Erro ao acessar a câmera';
        let description = 'Não foi possível iniciar a câmera. Por favor, verifique as permissões.';

        if (error instanceof Error) {
            if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
                title = 'Permissão da câmera negada';
                description = 'Você precisa permitir o acesso à câmera nas configurações do seu navegador para usar este recurso.';
            } else if (error.name === 'NotFoundError') {
                title = 'Nenhuma câmera encontrada';
                description = 'Não foi possível encontrar um dispositivo de câmera conectado.';
            }
        }

        toast({ variant: 'destructive', title, description, duration: 9000 });
      }
    };

    getCameraPermission();

    // Cleanup function to stop camera stream when component unmounts
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [toast]);

  const handleCheckIn = (note?: string) => {
    setIsCheckingIn(true);
    // Simulate network delay for check-in process
    setTimeout(() => {
      setIsCheckedIn(true);
      const now = new Date();
      setLastCheckIn(now);

      let toastTitle = 'Entrada Registrada';
      let toastDescription = `Sua chegada foi registrada às ${now.toLocaleTimeString('pt-BR')}.`;

      if (note) {
        toastTitle = 'Entrada Registrada com Justificativa';
        toastDescription = `Justificativa: ${note}`;
      }

      toast({ title: toastTitle, description: toastDescription });
      setIsCheckingIn(false);
      setJustification('');
      setIsJustificationDialogOpen(false);
    }, 1000);
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    const now = new Date();
    toast({
      title: 'Saída Registrada',
      description: `Sua saída foi registrada às ${now.toLocaleTimeString('pt-BR')}.`,
    });
  };

  const handleClockInClick = () => {
    if (hasCameraPermission) {
      handleCheckIn();
    } else {
      setIsJustificationDialogOpen(true);
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
  };

  if (time === null) {
    return (
      <Card className="lg:col-span-1 flex flex-col justify-center items-center">
        <CardHeader>
          <CardTitle>Carregando Relógio de Ponto...</CardTitle>
        </CardHeader>
        <CardContent>
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
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
        <CardContent className="flex flex-col flex-grow justify-between gap-4">
          <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            {hasCameraPermission === false && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 p-4 text-center">
                <VideoOff className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="font-semibold">Câmera indisponível</p>
                <p className="text-sm text-muted-foreground">
                  O acesso à câmera é necessário para o registro por foto.
                </p>
              </div>
            )}
            {hasCameraPermission === null && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 p-4 text-center">
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                <p className="text-sm text-muted-foreground mt-4">
                  Aguardando permissão da câmera...
                </p>
              </div>
            )}
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold tracking-tighter">
              {time.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
            {lastCheckIn && (
              <p className="text-sm text-muted-foreground mt-1">
                {isCheckedIn ? 'Chegada registrada às' : 'Última chegada às'}{' '}
                {lastCheckIn.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>

          {isCheckedIn ? (
            <Button
              onClick={handleCheckOut}
              variant="destructive"
              className="w-full"
            >
              <ArrowDownCircle className="mr-2"/>
              Registrar Saída
            </Button>
          ) : (
            <Button
              onClick={handleClockInClick}
              className="w-full bg-green-600 hover:bg-green-700 text-primary-foreground"
              disabled={isCheckingIn || hasCameraPermission === null}
            >
              {isCheckingIn ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <Video className="h-5 w-5 mr-2" />
              )}
              {isCheckingIn ? 'Registrando...' : 'Registrar Chegada com Foto'}
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isJustificationDialogOpen}
        onOpenChange={setIsJustificationDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registro Manual de Entrada</DialogTitle>
            <DialogDescription>
              Como a câmera não está disponível, por favor, forneça uma
              justificativa para registrar sua entrada.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="justification">Justificativa (obrigatória)</Label>
              <Textarea
                id="justification"
                placeholder="Ex: A câmera do celular não está funcionando ou a permissão foi negada."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsJustificationDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleJustificationSubmit} disabled={isCheckingIn}>
              {isCheckingIn && <Loader2 className="animate-spin mr-2" />}
              {isCheckingIn ? 'Enviando...' : 'Enviar Registro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
