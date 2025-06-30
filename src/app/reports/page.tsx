import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function ReportsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatórios</CardTitle>
        <CardDescription>
          Gere e visualize relatórios de presença e folha de pagamento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">
            Funcionalidade de Relatórios em Breve
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta seção está em construção. Em breve você poderá gerar
            relatórios detalhados.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
