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

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(
    null
  );
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [isJustificationDialogOpen, setIsJustificationDialogOpen] =
    useState(false);
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (
      typeof window === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setHasCameraPermission(false);
      return;
    }
    if (streamRef.current?.active) {
      return;
    }

    setIsCameraStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCameraPermission(true);
    } catch (error) {
      setHasCameraPermission(false);
      let title = 'Erro ao acessar a câmera';
      let description =
        'Não foi possível iniciar a câmera. Verifique as permissões.';

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          title = 'Permissão da câmera negada';
          description =
            'Permita o acesso à câmera nas configurações do seu navegador para usar esta função. A sua empresa será notificada.';
        } else if (error.name === 'NotFoundError') {
          title = 'Nenhuma câmera encontrada';
          description = 'Não encontramos um dispositivo de câmera conectado.';
        } else if (error.name === 'NotReadableError') {
          title = 'Câmera em uso';
          description = 'Outro aplicativo ou aba pode estar usando a câmera.';
        } else if (error.name === 'SecurityError') {
            title = 'Acesso Inseguro';
            description = 'O acesso à câmera é permitido apenas em conexões seguras (HTTPS).';
        }
      }
      toast({ variant: 'destructive', title, description, duration: 9000 });
    } finally {
      setIsCameraStarting(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isCheckedIn) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [isCheckedIn, startCamera, stopCamera]);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);

    // Cleanup camera on component unmount
    return () => {
      clearInterval(timer);
      stopCamera();
    };
  }, [stopCamera]);

  const handleClockIn = async () => {
    setIsSubmitting(true);
    let photoDataUrl: string | undefined;

    if (hasCameraPermission && videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (video.videoWidth === 0) {
        toast({
            variant: 'destructive',
            title: 'Erro de Câmera',
            description: 'A câmera ainda não está pronta. Tente novamente em um segundo.'
        });
        setIsSubmitting(false);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        photoDataUrl = canvas.toDataURL('image/jpeg');
      }
    }

    const formData = new FormData();
    if (photoDataUrl) {
      formData.append('photoDataUrl', photoDataUrl);
    }

    const result = await registerTimeClockAction(formData);

    if (result.success) {
      setIsCheckedIn(true); // This will trigger the useEffect to stop the camera
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
      setIsCheckedIn(true); // This also stops the camera via useEffect
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
    setIsCheckedIn(false); // This will trigger the useEffect to start the camera
    const now = new Date();
    // This is a placeholder for the UI feedback. A real checkout would need its own photo capture logic.
    toast({
      title: 'Pronto para Registrar Saída',
      description: `Sua saída será registrada às ${now.toLocaleTimeString(
        'pt-BR'
      )}. Aponte para a câmera.`,
    });
  };

  const handleClockInClick = () => {
    if (hasCameraPermission) {
      handleClockIn();
    } else {
      setIsJustificationDialogOpen(true);
    }
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
              className={`w-full h-full object-cover ${
                isCheckedIn ? 'hidden' : 'block'
              }`}
              autoPlay
              muted
              playsInline
            />
            
            {!isCheckedIn && isCameraStarting && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 p-4 text-center">
                    <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                    <p className="text-sm text-muted-foreground mt-4">Iniciando câmera...</p>
                </div>
            )}
            
            {isCheckedIn && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 p-4 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                    <p className="font-semibold">Entrada Registrada</p>
                    <p className="text-sm text-muted-foreground">Câmera desligada.</p>
                </div>
            )}

            {!isCheckedIn && !isCameraStarting && hasCameraPermission === false && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 p-4 text-center">
                <VideoOff className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="font-semibold">Câmera indisponível</p>
                <p className="text-sm text-muted-foreground">
                  O registro manual com justificativa será usado.
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
                {isCheckedIn ? 'Entrada registrada às' : 'Última entrada às'}{' '}
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
              <ArrowDownCircle className="mr-2 h-4 w-4" />
              Registrar Saída
            </Button>
          ) : (
            <Button
              onClick={handleClockInClick}
              className="w-full bg-green-600 hover:bg-green-700 text-primary-foreground"
              disabled={isSubmitting || hasCameraPermission === null || isCameraStarting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Camera className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? 'Registrando...' : 'Registrar Chegada'}
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
              onClick={() => setIsJustificationDialogOpen(false)}
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
