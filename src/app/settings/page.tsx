import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações</CardTitle>
        <CardDescription>
          Gerencie sua conta e as configurações do aplicativo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
          <Settings className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">
            Página de Configurações em Breve
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta seção está em construção. Em breve você poderá gerenciar
            todas as configurações aqui.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
