import CalendarView from '@/components/calendar/calendar-view';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function CalendarPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendário da Equipe</CardTitle>
        <CardDescription>
          Visão geral visual da presença da equipe, ausências e feriados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CalendarView />
      </CardContent>
    </Card>
  );
}
