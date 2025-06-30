'use client';

import { Calendar } from '@/components/ui/calendar';
import { useState } from 'react';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

const vacationDays: Date[] = [];
const sickDays: Date[] = [];
const personalDays: Date[] = [];
const tardinessDays: Date[] = [];


export default function CalendarView() {
  const [month, setMonth] = useState(new Date());

  const absenceDays = [...vacationDays, ...sickDays, ...personalDays];
  const allEventDays = [...absenceDays, ...tardinessDays];

  return (
    <div>
      <Calendar
        locale={ptBR}
        mode="multiple"
        month={month}
        onMonthChange={setMonth}
        className="rounded-md border p-0"
        numberOfMonths={3}
        modifiers={{
          vacation: vacationDays,
          sick: sickDays,
          personal: personalDays,
          tardiness: tardinessDays,
          presence: (date) => {
              const weekDay = date.getDay();
              if (weekDay === 0 || weekDay === 6) return false; // weekend
              return !allEventDays.some(eventDay => eventDay.getTime() === date.getTime());
          }
        }}
        components={{
          DayContent: (props) => {
            const { date, activeModifiers } = props;
            const isVacation = activeModifiers.vacation;
            const isSick = activeModifiers.sick;
            const isPersonal = activeModifiers.personal;
            const isTardiness = activeModifiers.tardiness;
            const isPresence = activeModifiers.presence;

            let icon = null;
            if (isVacation || isSick || isPersonal) {
                icon = <XCircle className="h-4 w-4 text-destructive-foreground" />;
            } else if (isTardiness) {
                icon = <AlertTriangle className="h-4 w-4 text-primary" />;
            } else if (isPresence) {
                icon = <CheckCircle2 className="h-4 w-4 text-green-500" />;
            }

            return <div className="relative flex items-center justify-center h-full w-full">
                {props.date.getDate()}
                {icon && <div className="absolute top-0 right-0 transform translate-x-1 -translate-y-1">{icon}</div>}
            </div>
          }
        }}
        modifiersStyles={{
            vacation: { backgroundColor: 'hsl(var(--destructive) / 0.5)' },
            sick: { backgroundColor: 'hsl(var(--destructive) / 0.75)' },
            personal: { backgroundColor: 'hsl(var(--destructive) / 0.25)' },
            tardiness: {
                borderColor: 'hsl(var(--primary))',
            }
        }}
      />
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" /> Presença
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-destructive" /> Ausência (Férias, Médica, etc.)
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" /> Atraso
        </div>
      </div>
    </div>
  );
}
