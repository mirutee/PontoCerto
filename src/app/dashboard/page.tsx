import TimeClock from '@/components/dashboard/time-clock';
import TeamAttendance from '@/components/dashboard/team-attendance';
import UpcomingAbsences from '@/components/dashboard/upcoming-absences';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { BarChart, Clock, Users } from 'lucide-react';
import ProductivityChart from '@/components/dashboard/productivity-chart';

export default function DashboardPage() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Horas Registradas Hoje
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6h 32m</div>
            <p className="text-xs text-muted-foreground">
              -2.1% desde ontem
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipe Presente</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18/22</div>
            <p className="text-xs text-muted-foreground">+1 desde a última hora</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Extras</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12h</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>
        <TimeClock />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Gráfico de Produtividade</CardTitle>
            <CardDescription>
              Dias trabalhados, faltas e horas extras no mês.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductivityChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Ausências Próximas</CardTitle>
            <CardDescription>
              Folgas planejadas para a próxima semana.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UpcomingAbsences />
          </CardContent>
        </Card>
      </div>
       <Card>
          <CardHeader>
            <CardTitle>Presença da Equipe</CardTitle>
            <CardDescription>
              Visão geral do status atual da sua equipe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamAttendance />
          </CardContent>
        </Card>
    </div>
  );
}
