
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
  CheckCircle,
  ArrowUpCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../ui/label';
import { registerTimeClockAction, getClockStatus } from '@/app/actions/time-clock-actions';

export default function TimeClock() {
  const [time, setTime] = useState<Date | null>(null);
  const [clockState, setClockState] = useState<'loading' | 'clocked_out' | 'clocked_in'>('loading');
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);
  const { toast } = useToast();

  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isJustificationDialogOpen, setIsJustificationDialogOpen] =
    useState(false);
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'in' | 'out'>('in');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    getClockStatus().then(status => {
        if (status.clockedIn && status.lastCheckInTime) {
            setClockState('clocked_in');
            setLastCheckIn(new Date(status.lastCheckInTime));
        } else {
            setClockState('clocked_out');
        }
    });

    return () => {
      clearInterval(timer);
      stopCamera();
    };
  }, []);

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
    if (streamRef.current?.active) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      return true;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Câmera não disponível', description: 'Por favor, permita o acesso à câmera ou use a justificativa.' });
      return false;
    }
  }, [toast]);

  const handleSubmit = async (photoDataUrl: string | null, justificationText: string | null) => {
    setIsSubmitting(true);
    stopCamera();

    const formData = new FormData();
    formData.append('actionType', actionType);
    if (photoDataUrl) {
      formData.append('photoDataUrl', photoDataUrl);
    }
    if (justificationText) {
      formData.append('justification', justificationText);
    }

    const result = await registerTimeClockAction(formData);

    if (result.success) {
      toast({ title: 'Sucesso!', description: result.message });
      if (actionType === 'in' && result.data?.time) {
          setClockState('clocked_in');
          setLastCheckIn(new Date(result.data.time));
      } else {
          setClockState('clocked_out');
          setLastCheckIn(null);
      }
      setIsJustificationDialogOpen(false);
      setJustification('');
    } else {
      toast({ variant: 'destructive', title: 'Falha no Registro', description: result.message });
    }
    setIsSubmitting(false);
  };
  
  const captureAndSubmit = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (video.videoWidth > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const photoDataUrl = canvas.toDataURL('image/jpeg');
                handleSubmit(photoDataUrl, null);
                return;
            }
        }
    }
    toast({ variant: 'destructive', title: 'Falha na Captura', description: 'Não foi possível capturar a imagem.' });
    stopCamera();
    setIsSubmitting(false);
  }, [actionType, stopCamera, toast]);


  useEffect(() => {
    if (countdown === 0) {
      captureAndSubmit();
    }
  }, [countdown, captureAndSubmit]);

  const handleClockActionClick = async () => {
    const currentAction = clockState === 'clocked_in' ? 'out' : 'in';
    setActionType(currentAction);
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
      setIsJustificationDialogOpen(true); // Open justification dialog if camera fails
      setIsSubmitting(false);
    }
  };

  const handleJustificationSubmit = async () => {
    if (justification.trim().length < 10) {
      toast({ variant: 'destructive', title: 'Justificativa Inválida', description: 'Precisa ter pelo menos 10 caracteres.' });
      return;
    }
    handleSubmit(null, justification);
  };

  if (time === null || clockState === 'loading') {
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
  
  const isClockedIn = clockState === 'clocked_in';
  const buttonText = isClockedIn ? 'Registrar Saída' : 'Registrar Chegada';
  const ButtonIcon = isClockedIn ? ArrowDownCircle : ArrowUpCircle;

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <Card className="lg:col-span-1 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Relógio de Ponto</CardTitle>
          <CardDescription className="text-xs">
            {time.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow justify-between gap-4">
          <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden flex items-center justify-center">
            <video ref={videoRef} className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraVisible ? 'opacity-100' : 'opacity-0'}`} autoPlay muted playsInline />

            {!isCameraVisible && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                 {isClockedIn ? <CheckCircle className="h-12 w-12 text-green-500 mb-4" /> : <Video className="h-12 w-12" />}
                 <p className="font-semibold">{isClockedIn ? "Entrada Registrada" : "Câmera Pronta"}</p>
                 <p className="text-sm">{isClockedIn ? "Câmera desligada." : "Clique para registrar o ponto."}</p>
              </div>
            )}

            {isCameraVisible && countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <p className="text-8xl font-bold text-white tabular-nums">{countdown}</p>
              </div>
            )}
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold tracking-tighter">
              {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            {lastCheckIn && (
              <p className="text-sm text-muted-foreground mt-1">
                Última entrada às{' '}{lastCheckIn.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          
          <Button onClick={handleClockActionClick} className="w-full" variant={isClockedIn ? 'destructive' : 'default'} disabled={isSubmitting}>
             {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ButtonIcon className="mr-2 h-4 w-4" />}
             {isSubmitting ? 'Registrando...' : buttonText}
          </Button>

        </CardContent>
      </Card>

      <Dialog open={isJustificationDialogOpen} onOpenChange={setIsJustificationDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registro Manual</DialogTitle>
            <DialogDescription>
              A câmera não está disponível. Forneça uma justificativa para o registro.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="justification">Justificativa (obrigatória)</Label>
              <Textarea id="justification" placeholder="Ex: A câmera não está funcionando." value={justification} onChange={(e) => setJustification(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsJustificationDialogOpen(false); setIsSubmitting(false); }}>Cancelar</Button>
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
