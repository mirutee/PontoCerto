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
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

type Document = {
  id: string;
  type: string;
  date: string;
  status: string;
};

const documents: Document[] = [];

export default function DocumentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Central de Documentos</CardTitle>
        <CardDescription>
          Histórico de suas justificativas, atestados e documentos enviados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tipo de Documento</TableHead>
              <TableHead>Data de Envio</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length > 0 ? (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.id}</TableCell>
                  <TableCell className="font-medium">{doc.type}</TableCell>
                  <TableCell>{doc.date}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{doc.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Baixar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        Nenhum documento encontrado.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
