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
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/models';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

type AbsenceRequest = Database['public']['Tables']['faltas_programadas']['Row'];

export default function AbsencePage() {
  const [requests, setRequests] = useState<AbsenceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Usuário não autenticado.");
        }
        const userId = session.user.id;

        const { data, error } = await supabase
            .from('faltas_programadas')
            .select('*')
            .eq('funcionario_id', userId)
            .order('criado_em', { ascending: false });

        if (error) {
          throw new Error(`Falha ao buscar solicitações: ${error.message}`);
        }
        setRequests(data || []);
      } catch (error: any) {
         toast({ variant: 'destructive', title: 'Erro', description: error.message });
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, [toast]);
  
  const getStatusVariant = (
    status: string
  ): 'secondary' | 'default' | 'destructive' | 'outline' => {
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

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <AbsenceRequestForm
          onNewRequest={(newRequest) => setRequests([newRequest, ...requests])}
        />
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data de Início</TableHead>
                  <TableHead>Data de Fim</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      Carregando suas solicitações...
                    </TableCell>
                  </TableRow>
                ) : requests.length > 0 ? (
                  requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.tipo}</TableCell>
                      <TableCell>{formatDate(request.data_inicio)}</TableCell>
                      <TableCell>{request.data_fim ? formatDate(request.data_fim) : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(request.status_aprovacao)}>
                          {request.status_aprovacao}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
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
