'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { PlusCircle, MoreHorizontal, Check, X, Download } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { createEmployeeAction, updateEmployeeAction, toggleEmployeeStatusAction } from '@/app/actions/employee-actions';
import { updateAbsenceRequestStatus } from '@/app/actions/absence-actions';
import type { Database } from '@/lib/supabase/models';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Employee = Database['public']['Tables']['funcionarios']['Row'];
type Company = Database['public']['Tables']['empresas']['Row'];
type AbsenceRequest = (Database['public']['Tables']['faltas_programadas']['Row'] & {
  funcionarios: { nome: string | null; email: string | null } | null;
});


export default function CompanyPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>([]);
  const [isRequestsLoading, setIsRequestsLoading] = useState(true);

  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    name: '', email: '', cpf: '', cargo: '', password: ''
  });

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditEmployeeDialogOpen, setIsEditEmployeeDialogOpen] = useState(false);
  const [isToggleStatusAlertOpen, setIsToggleStatusAlertOpen] = useState(false);
  const [editEmployeeForm, setEditEmployeeForm] = useState({
    name: '', cargo: '', cpf: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      setIsRequestsLoading(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast({ variant: 'destructive', title: 'Não autenticado', description: 'Você precisa estar logado para ver esta página.' });
        router.push('/login');
        return;
      }
      const userId = session.user.id;
      
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('usuarios')
          .select('cnpj, tipo')
          .eq('id', userId)
          .single();
        
        if (profileError || !userProfile || userProfile.tipo !== 'empresa') {
          throw new Error('Perfil da empresa não encontrado ou inválido.');
        }

        if (!userProfile.cnpj) {
            throw new Error('O CNPJ da empresa não está definido no perfil do usuário.');
        }

        const { data: companyData, error: companyError } = await supabase
          .from('empresas')
          .select('*')
          .eq('cnpj', userProfile.cnpj)
          .single();
        
        if (companyError || !companyData) {
          throw new Error('Dados da empresa não encontrados.');
        }
        setCompany(companyData);

        const [employeesRes, requestsRes] = await Promise.all([
            supabase
                .from('funcionarios')
                .select('*')
                .eq('empresa_id', companyData.id),
            supabase
                .from('faltas_programadas')
                .select(`*, funcionarios (nome, email)`)
                .eq('empresa_id', companyData.id)
                .order('criado_em', { ascending: false })
        ]);
        
        if (employeesRes.error) throw new Error('Não foi possível carregar os funcionários.');
        setEmployees(employeesRes.data || []);
        
        if (requestsRes.error) throw new Error(`Falha ao buscar solicitações: ${requestsRes.error.message}`);
        setAbsenceRequests(requestsRes.data as AbsenceRequest[] || []);

      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: error.message });
        router.push('/login');
      } finally {
        setIsLoading(false);
        setIsRequestsLoading(false);
      }
    };
    fetchAllData();
  }, [router, toast]);

  const handleOpenEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditEmployeeForm({
      name: employee.nome || '',
      cargo: employee.cargo || '',
      cpf: 'Carregando...'
    });
    setIsEditEmployeeDialogOpen(true);

    supabase.from('usuarios').select('cnpj').eq('id', employee.id).single()
      .then(({ data, error }) => {
        if (error && error.code !== 'PGRST116') {
           toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar o CPF do funcionário.' });
           setEditEmployeeForm(prev => ({...prev, cpf: 'Erro ao carregar'}));
        } else if (data) {
           setEditEmployeeForm(prev => ({...prev, cpf: data.cnpj || ''}));
        }
    });
  };
  
  const handleOpenToggleStatusAlert = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsToggleStatusAlertOpen(true);
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;
    setIsSubmitting(true);
    try {
      const result = await updateEmployeeAction({
        id: selectedEmployee.id,
        name: editEmployeeForm.name,
        cargo: editEmployeeForm.cargo,
        cpf: editEmployeeForm.cpf,
      });
      
      if (!result) {
        toast({ variant: 'destructive', title: 'Falha na Comunicação', description: 'Não foi possível contactar o servidor. Por favor, recarregue a página e tente novamente.' });
        setIsSubmitting(false);
        return;
      }

      if (result.success && result.employee) {
        setEmployees(prev => prev.map(e => e.id === result.employee!.id ? result.employee! : e));
        toast({ title: 'Sucesso!', description: result.message });
        setIsEditEmployeeDialogOpen(false);
      } else {
        throw new Error(result.message || 'Ocorreu um erro ao atualizar o funcionário.');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao Atualizar', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEmployeeStatus = async () => {
    if (!selectedEmployee || !selectedEmployee.status) return;
    setIsSubmitting(true);
    try {
        const result = await toggleEmployeeStatusAction({
            id: selectedEmployee.id,
            status: selectedEmployee.status as 'Ativo' | 'Inativo',
        });

        if (!result || typeof result.success === 'undefined') {
            toast({ variant: 'destructive', title: 'Falha na Comunicação', description: 'A resposta do servidor foi inválida. Por favor, recarregue a página e tente novamente.' });
            setIsSubmitting(false);
            setIsToggleStatusAlertOpen(false);
            return;
        }

        if (result.success && result.employee) {
            setEmployees(prev => prev.map(e => e.id === result.employee!.id ? result.employee! : e));
            toast({ title: 'Status Alterado!', description: result.message });
        } else {
            throw new Error(result.message || 'Ocorreu um erro ao alterar o status.');
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro ao Alterar Status', description: error.message });
    } finally {
        setIsSubmitting(false);
        setIsToggleStatusAlertOpen(false);
    }
  };


  const handleAddEmployee = async () => {
    if (!company) {
      toast({ variant: 'destructive', title: 'Erro', description: 'ID da empresa não encontrado. Recarregue a página.' });
      return;
    }
    setIsAddingEmployee(true);
    try {
      const result = await createEmployeeAction({
        companyId: company.id,
        name: newEmployeeForm.name,
        email: newEmployeeForm.email,
        cpf: newEmployeeForm.cpf,
        cargo: newEmployeeForm.cargo,
        password: newEmployeeForm.password,
      });

      if (result.success && result.employee) {
        setEmployees(prev => [...prev, result.employee!]);
        toast({ title: 'Sucesso!', description: result.message });
        setIsAddEmployeeDialogOpen(false);
        setNewEmployeeForm({ name: '', email: '', cpf: '', cargo: '', password: '' });
      } else {
        throw new Error(result.message || 'Ocorreu um erro desconhecido.');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao Adicionar Funcionário', description: error.message });
    } finally {
      setIsAddingEmployee(false);
    }
  };
  
  const handleAbsenceAction = async (requestId: number, newStatus: 'Aprovado' | 'Rejeitado') => {
    const originalRequests = [...absenceRequests];
    setAbsenceRequests(requests => requests.map(r => r.id === requestId ? {...r, status_aprovacao: newStatus} : r));

    const result = await updateAbsenceRequestStatus(requestId, newStatus);
    if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
    } else {
        setAbsenceRequests(originalRequests);
        toast({ variant: 'destructive', title: 'Erro', description: result.message });
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewEmployeeForm(prev => ({ ...prev, [id]: value }));
  }
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setEditEmployeeForm(prev => ({...prev, [id]: value }));
  }

  const getStatusVariant = (status: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Ativo':
      case 'Aprovado':
        return 'secondary';
      case 'Inativo':
      case 'Rejeitado':
        return 'destructive';
      case 'Pendente':
        return 'default';
      default:
        return 'outline';
    }
  };
  
  const formatDateRange = (start: string, end: string | null) => {
    const startDate = format(parseISO(start), "dd/MM/yyyy", { locale: ptBR });
    if (!end) return startDate;
    const endDate = format(parseISO(end), "dd/MM/yyyy", { locale: ptBR });
    return `${startDate} - ${endDate}`;
  }

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center">
                <p>Carregando dados da empresa...</p>
            </div>
        </div>
    );
  }


  return (
    <>
    <Tabs defaultValue="employees">
        <div className="flex justify-between items-center mb-4">
            <TabsList>
                <TabsTrigger value="employees">Funcionários</TabsTrigger>
                <TabsTrigger value="approvals">Aprovações de Ausência</TabsTrigger>
                <TabsTrigger value="settings">Configurações de Jornada</TabsTrigger>
            </TabsList>
             <Button onClick={() => setIsAddEmployeeDialogOpen(true)}>
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
                                        alt={employee.nome || ''}
                                        data-ai-hint="person portrait"
                                    />
                                    <AvatarFallback>{employee.nome?.substring(0,2)}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid gap-0.5">
                                        <span className="font-medium">{employee.nome}</span>
                                        <span className="text-xs text-muted-foreground">{employee.email}</span>
                                    </div>
                                </div>
                                </TableCell>
                                <TableCell>{employee.cargo}</TableCell>
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
                                    <DropdownMenuItem onClick={() => handleOpenEditDialog(employee)}>Editar</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleOpenToggleStatusAlert(employee)} className={employee.status === 'Ativo' ? 'text-destructive' : ''}>
                                      {employee.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                                    </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                Nenhum funcionário encontrado. Clique em "Adicionar Funcionário" para começar.
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
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Funcionário</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Período</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isRequestsLoading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Carregando...</TableCell></TableRow>
                        ) : absenceRequests.length > 0 ? (
                            absenceRequests.map((request) => (
                                <TableRow key={request.id}>
                                    <TableCell>{request.funcionarios?.nome || 'N/A'}</TableCell>
                                    <TableCell>{request.tipo}</TableCell>
                                    <TableCell>{formatDateRange(request.data_inicio, request.data_fim)}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(request.status_aprovacao)}>{request.status_aprovacao}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {request.status_aprovacao === 'Pendente' ? (
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleAbsenceAction(request.id, 'Aprovado')}><Check className="h-4 w-4 mr-1"/> Aprovar</Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleAbsenceAction(request.id, 'Rejeitado')}><X className="h-4 w-4 mr-1"/> Rejeitar</Button>
                                            </div>
                                        ) : (
                                            <span>Resolvido</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhuma solicitação de ausência encontrada.</TableCell></TableRow>
                        )}
                        </TableBody>
                    </Table>
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

    {/* Add Employee Dialog */}
    <Dialog open={isAddEmployeeDialogOpen} onOpenChange={setIsAddEmployeeDialogOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Funcionário</DialogTitle>
          <DialogDescription>
            A empresa cria o login e a senha para o funcionário acessar o sistema.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nome</Label>
            <Input id="name" value={newEmployeeForm.name} onChange={handleFormChange} className="col-span-3" placeholder="Nome completo" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" type="email" value={newEmployeeForm.email} onChange={handleFormChange} className="col-span-3" placeholder="email@dominio.com" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cpf" className="text-right">CPF</Label>
            <Input id="cpf" value={newEmployeeForm.cpf} onChange={handleFormChange} className="col-span-3" placeholder="Apenas números" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cargo" className="text-right">Cargo</Label>
            <Input id="cargo" value={newEmployeeForm.cargo} onChange={handleFormChange} className="col-span-3" placeholder="Ex: Vendedor" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">Senha</Label>
            <Input id="password" type="password" value={newEmployeeForm.password} onChange={handleFormChange} className="col-span-3" placeholder="Mínimo 6 caracteres" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleAddEmployee} disabled={isAddingEmployee}>
            {isAddingEmployee ? 'Adicionando...' : 'Adicionar Funcionário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Edit Employee Dialog */}
    <Dialog open={isEditEmployeeDialogOpen} onOpenChange={setIsEditEmployeeDialogOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Editar Funcionário</DialogTitle>
          <DialogDescription>
            Altere os dados cadastrais do funcionário. O email não pode ser alterado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nome</Label>
            <Input id="name" value={editEmployeeForm.name} onChange={handleEditFormChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cpf" className="text-right">CPF</Label>
            <Input id="cpf" value={editEmployeeForm.cpf} onChange={handleEditFormChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cargo" className="text-right">Cargo</Label>
            <Input id="cargo" value={editEmployeeForm.cargo} onChange={handleEditFormChange} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleUpdateEmployee} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* Deactivate/Activate Alert Dialog */}
    <AlertDialog open={isToggleStatusAlertOpen} onOpenChange={setIsToggleStatusAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação irá {selectedEmployee?.status === 'Ativo' ? 'desativar' : 'ativar'} o funcionário "{selectedEmployee?.nome}". 
                    {selectedEmployee?.status === 'Ativo' ? ' Ele não poderá mais acessar o sistema.' : ' Ele poderá voltar a acessar o sistema.'}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleToggleEmployeeStatus} 
                  disabled={isSubmitting}
                  className={selectedEmployee?.status === 'Ativo' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                >
                   {isSubmitting ? 'Alterando...' : `Sim, ${selectedEmployee?.status === 'Ativo' ? 'desativar' : 'ativar'}`}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
