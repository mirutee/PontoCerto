'use client';

import { useState } from 'react';
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
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Employee = {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
};

const initialEmployees: Employee[] = [];

export default function CompanyPage() {
  const [employees, setEmployees] = useState(initialEmployees);

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Ativo':
        return 'secondary';
      case 'Inativo':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Tabs defaultValue="employees">
        <div className="flex justify-between items-center mb-4">
            <TabsList>
                <TabsTrigger value="employees">Funcionários</TabsTrigger>
                <TabsTrigger value="approvals">Aprovações de Ausência</TabsTrigger>
                <TabsTrigger value="settings">Configurações de Jornada</TabsTrigger>
            </TabsList>
             <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Funcionário
            </Button>
        </div>
        <TabsContent value="employees">
            <Card>
            <CardHeader>
                <CardTitle>Gerenciamento de Funcionários</CardTitle>
                <CardDescription>
                Adicione, edite e gerencie os funcionários da sua empresa.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                        <span className="sr-only">Ações</span>
                    </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.length > 0 ? (
                        employees.map((employee) => (
                            <TableRow key={employee.id}>
                                <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                    <AvatarImage
                                        src={`https://placehold.co/40x40.png`}
                                        alt={employee.name}
                                        data-ai-hint="person portrait"
                                    />
                                    <AvatarFallback>{employee.name.substring(0,2)}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid gap-0.5">
                                        <span className="font-medium">{employee.name}</span>
                                        <span className="text-xs text-muted-foreground">{employee.email}</span>
                                    </div>
                                </div>
                                </TableCell>
                                <TableCell>{employee.role}</TableCell>
                                <TableCell>
                                <Badge variant={getStatusVariant(employee.status)}>
                                    {employee.status}
                                </Badge>
                                </TableCell>
                                <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Alternar menu</span>
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DropdownMenuItem>Editar</DropdownMenuItem>
                                    <DropdownMenuItem>Desativar</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                Nenhum funcionário encontrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="approvals">
            <Card>
                <CardHeader>
                    <CardTitle>Aprovações Pendentes</CardTitle>
                    <CardDescription>
                        Analise e aprove as justificativas e solicitações de folga dos funcionários.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground p-12">
                    <p>Nenhuma aprovação pendente no momento.</p>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="settings">
            <Card>
                <CardHeader>
                    <CardTitle>Configurações de Jornada</CardTitle>
                    <CardDescription>
                        Defina jornadas de trabalho, banco de horas e feriados para sua equipe.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground p-12">
                    <p>Funcionalidade em desenvolvimento.</p>
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>

  );
}
