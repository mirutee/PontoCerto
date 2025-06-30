'use client';
import AbsenceRequestForm from '@/components/absences/absence-request-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

type RecentRequest = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
};

const initialRequests: RecentRequest[] = [];

export default function AbsencePage() {
  const [recentRequests, setRecentRequests] = useState(initialRequests);
  const getStatusVariant = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Aprovado':
        return 'secondary';
      case 'Pendente':
        return 'default';
      case 'Rejeitado':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <AbsenceRequestForm />
      </div>
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Minhas Solicitações de Ausência</CardTitle>
            <CardDescription>
              Um histórico de suas solicitações de folga passadas e pendentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID da Solicitação</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data de Início</TableHead>
                  <TableHead>Data de Fim</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRequests.length > 0 ? (
                  recentRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.id}</TableCell>
                      <TableCell>{request.type}</TableCell>
                      <TableCell>{request.startDate}</TableCell>
                      <TableCell>{request.endDate}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      Nenhuma solicitação encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
