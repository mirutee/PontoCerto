'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Camera,
  Video,
  VideoOff,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../ui/label';
import { registerTimeClockAction } from '@/app/actions/time-clock-actions';

export default function TimeClock() {
  const [time, setTime] = useState<Date | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);
  const { toast } = useToast();

  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isJustificationDialogOpen, setIsJustificationDialogOpen] =
    useState(false);
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopCamera = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraVisible(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (
      typeof window === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      toast({
        variant: 'destructive',
        title: 'Câmera não suportada',
        description: 'Seu navegador não suporta acesso à câmera.',
      });
      return false;
    }
    if (streamRef.current?.active) {
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return true;
    } catch (error) {
      let title = 'Erro ao acessar a câmera';
      let description =
        'Não foi possível iniciar a câmera. Verifique as permissões.';

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          title = 'Permissão da câmera negada';
          description =
            'Permita o acesso à câmera nas configurações do seu navegador para usar esta função.';
        } else if (error.name === 'NotFoundError') {
          title = 'Nenhuma câmera encontrada';
          description = 'Não encontramos um dispositivo de câmera conectado.';
        } else if (error.name === 'NotReadableError') {
          title = 'Câmera em uso';
          description = 'Outro aplicativo ou aba pode estar usando a câmera.';
        } else if (error.name === 'SecurityError') {
          title = 'Acesso Inseguro';
          description =
            'O acesso à câmera é permitido apenas em conexões seguras (HTTPS).';
        }
      }
      toast({ variant: 'destructive', title, description, duration: 9000 });
      return false;
    }
  }, [toast]);

  const captureAndSubmitPhoto = useCallback(async () => {
    let photoDataUrl: string | undefined;

    if (isCameraVisible && videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          photoDataUrl = canvas.toDataURL('image/jpeg');
        }
      }
    }
    
    stopCamera();

    if (!photoDataUrl) {
        toast({ variant: 'destructive', title: 'Falha na Captura', description: 'Não foi possível capturar a imagem da câmera.' });
        setIsSubmitting(false);
        return;
    }

    const formData = new FormData();
    formData.append('photoDataUrl', photoDataUrl);

    const result = await registerTimeClockAction(formData);

    if (result.success) {
      setIsCheckedIn(true);
      const now = new Date();
      setLastCheckIn(now);
      toast({ title: 'Sucesso!', description: result.message });
    } else {
      toast({
        variant: 'destructive',
        title: 'Falha no Registro',
        description: result.message,
      });
    }
    setIsSubmitting(false);
  }, [isCameraVisible, stopCamera, toast]);


  useEffect(() => {
    if (countdown === 0) {
        captureAndSubmitPhoto();
    }
  }, [countdown, captureAndSubmitPhoto]);


  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => {
      clearInterval(timer);
      stopCamera();
    };
  }, [stopCamera]);

  const handleClockInClick = async () => {
    setIsSubmitting(true);
    const cameraStarted = await startCamera();
    if (cameraStarted) {
      setIsCameraVisible(true);
      setCountdown(3);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setIsJustificationDialogOpen(true);
      setIsSubmitting(false);
    }
  };

  const handleJustificationSubmit = async () => {
    if (justification.trim().length < 10) {
      toast({
        variant: 'destructive',
        title: 'Justificativa Inválida',
        description: 'A justificativa precisa ter pelo menos 10 caracteres.',
      });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('justification', justification);

    const result = await registerTimeClockAction(formData);

    if (result.success) {
      setIsCheckedIn(true);
      const now = new Date();
      setLastCheckIn(now);
      toast({ title: 'Sucesso!', description: result.message });
      setJustification('');
      setIsJustificationDialogOpen(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Falha no Registro',
        description: result.message,
      });
    }
    setIsSubmitting(false);
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    toast({
      title: 'Pronto para Registrar Saída',
      description: `Clique em 'Registrar Saída' para iniciar a captura.`,
    });
  };

  if (time === null) {
    return (
      <Card className="lg:col-span-1 flex flex-col justify-center items-center">
        <CardHeader>
          <CardTitle>Carregando Relógio...</CardTitle>
        </CardHeader>
        <CardContent>
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const ClockInButton = () => (
    <Button
      onClick={handleClockInClick}
      className="w-full bg-green-600 hover:bg-green-700 text-primary-foreground"
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Camera className="mr-2 h-4 w-4" />
      )}
      {isSubmitting ? 'Registrando...' : 'Registrar Chegada'}
    </Button>
  );

  const ClockOutButton = () => (
    <Button
      onClick={isCheckedIn ? handleCheckOut : handleClockInClick}
      variant={isCheckedIn ? 'destructive' : 'default'}
      className="w-full"
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
         isCheckedIn ? <ArrowDownCircle className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />
      )}
      {isSubmitting ? 'Registrando...' : (isCheckedIn ? 'Registrar Saída' : 'Registrar Chegada')}
    </Button>
  );


  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
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
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isCameraVisible ? 'opacity-100' : 'opacity-0'
              }`}
              autoPlay
              muted
              playsInline
            />

            {!isCameraVisible && !isCheckedIn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <Video className="h-12 w-12" />
                <p className="mt-2 text-sm">Câmera pronta</p>
              </div>
            )}

            {isCameraVisible && countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <p className="text-8xl font-bold text-white tabular-nums">
                  {countdown}
                </p>
              </div>
            )}
            
            {isCheckedIn && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted p-4 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                    <p className="font-semibold">Entrada Registrada</p>
                    <p className="text-sm text-muted-foreground">Câmera desligada.</p>
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
                {isCheckedIn ? 'Entrada registrada às' : 'Última entrada às'}{' '}
                {lastCheckIn.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
          
          <ClockOutButton />

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
              <Label htmlFor="justification">
                Justificativa (obrigatória)
              </Label>
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
              onClick={() => {
                  setIsJustificationDialogOpen(false);
                  setIsSubmitting(false);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleJustificationSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin mr-2" />}
              {isSubmitting ? 'Enviando...' : 'Enviar Registro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
