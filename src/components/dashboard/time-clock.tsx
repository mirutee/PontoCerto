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
import { ArrowUpCircle, ArrowDownCircle, MapPin } from 'lucide-react';

export default function TimeClock() {
  const [time, setTime] = useState<Date | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    setLastCheckIn(new Date());
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
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
          <Button onClick={handleCheckIn} className="w-full bg-green-600 hover:bg-green-700 text-primary-foreground">
            <ArrowUpCircle />
            Registrar Chegada
          </Button>
        )}
        <Textarea
          placeholder={isCheckedIn ? "Anotações ou justificativa de saída..." : "Anotações opcionais para hoje..."}
          className="text-sm mt-2"
          rows={2}
        />
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>Geolocalização ativada</span>
        </div>
      </CardContent>
    </Card>
  );
}
