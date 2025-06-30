
'use client';

import { useState, useEffect } from 'react';
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
import { MoreHorizontal, PlusCircle, Download, AlertCircle, CalendarIcon, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { differenceInDays, parseISO, format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase/client';
import { inviteCompanyAction } from '@/app/actions/admin-actions';
import type { Database } from '@/lib/supabase/models';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type Company = Database['public']['Tables']['empresas']['Row'];
type Plan = Database['public']['Tables']['planos']['Row'];
type History = Database['public']['Tables']['historico_empresas']['Row'] & { empresas: { nome: string | null } | null };

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [isAddCompanyDialogOpen, setIsAddCompanyDialogOpen] = useState(false);
  const [isChangePlanDialogOpen, setIsChangePlanDialogOpen] = useState(false);
  const [isEditVigenciaDialogOpen, setIsEditVigenciaDialogOpen] = useState(false);
  const [isAddPlanDialogOpen, setIsAddPlanDialogOpen] = useState(false);
  const [isEditPlanDialogOpen, setIsEditPlanDialogOpen] = useState(false);
  
  const [companyToRevoke, setCompanyToRevoke] = useState<Company | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [adminWpp, setAdminWpp] = useState('');
  const [tempWpp, setTempWpp] = useState('');
  const [adminId, setAdminId] = useState<string | null>(null);
  
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyCnpj, setNewCompanyCnpj] = useState('');
  const [newCompanyPlanId, setNewCompanyPlanId] = useState('');
  const [newCompanyEmail, setNewCompanyEmail] = useState('');
  const [isAddingCompany, setIsAddingCompany] = useState(false);

  const [newPlanIdForEdit, setNewPlanIdForEdit] = useState<string>('');
  const [newVigenciaForEdit, setNewVigenciaForEdit] = useState<Date | undefined>(undefined);
  
  const [planForm, setPlanForm] = useState<{
    nome: string; 
    valor: string; 
    max_funcionarios: string; 
    descricao: string;
    desconto_anual_percentual: string;
  }>({
    nome: '',
    valor: '',
    max_funcionarios: '',
    descricao: '',
    desconto_anual_percentual: ''
  });

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: userProfile } = await supabase
        .from('usuarios')
        .select('tipo, id, telefone')
        .eq('id', session.user.id)
        .single();
      
      if (!userProfile || userProfile.tipo !== 'admin') {
        toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem permissão para acessar esta página.' });
        await supabase.auth.signOut();
        router.push('/login');
        return;
      }
      
      setAdminId(userProfile.id);
      if (userProfile.telefone) {
        setAdminWpp(userProfile.telefone);
        setTempWpp(userProfile.telefone);
      }
      
      try {
        const [companiesRes, plansRes, historyRes] = await Promise.all([
          supabase.from('empresas').select('*'),
          supabase.from('planos').select('*'),
          supabase.from('historico_empresas').select(`*, empresas (nome)`).order('data', { ascending: false })
        ]);

        if (companiesRes.error) throw companiesRes.error;
        if (plansRes.error) throw plansRes.error;
        if (historyRes.error) throw historyRes.error;
        
        setCompanies(companiesRes.data || []);
        setPlans(plansRes.data || []);
        setHistory(historyRes.data as History[] || []);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro de Conexão', description: error.message || 'Não foi possível carregar os dados.' });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserAndFetchData();
  }, [router, toast]);

  const getStatusVariant = (status: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Pago':
        return 'secondary';
      case 'Pendente':
        return 'default';
      case 'Vencido':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const isExpiringSoon = (dateStr: string | null): boolean => {
    if (!dateStr) return false;
    try {
        const expirationDate = parseISO(dateStr);
        const today = new Date();
        const daysDiff = differenceInDays(expirationDate, today);
        return daysDiff >= 0 && daysDiff <= 5;
    } catch (e) {
        return false;
    }
  };
  
  const handleSaveWpp = async () => {
    if (!adminId) {
      toast({ variant: 'destructive', title: 'Erro', description: 'ID do administrador não encontrado.' });
      return;
    }
    if (!tempWpp) {
      toast({ variant: 'destructive', title: 'Erro de Validação', description: 'O número de telefone não pode estar vazio.' });
      return;
    }
    try {
      const { error } = await supabase.from('usuarios').update({ telefone: tempWpp }).eq('id', adminId);
      if (error) throw error;
      setAdminWpp(tempWpp);
      toast({ title: 'Número Salvo!', description: 'Seu número de WhatsApp foi salvo.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao Salvar', description: error.message });
    }
  };

  useEffect(() => {
    if (!adminWpp || isLoading) return;
    companies.forEach(company => {
        if (company.status_pagamento !== 'Pago' || !company.vigencia) return;
        try {
            const expirationDate = parseISO(company.vigencia);
            const today = new Date();
            const daysDiff = differenceInDays(expirationDate, today);
            if (daysDiff >= 0 && daysDiff <= 5) {
                const daysText = daysDiff === 0 ? 'hoje' : `em ${daysDiff} dia(s)`;
                toast({ title: `Simulação de Notificação para ${adminWpp}`, description: `O plano da ${company.nome} expira ${daysText}.`, duration: 10000 });
            }
        } catch (e) {
            console.error("Invalid date format for company", company.nome, company.vigencia);
        }
    });
  }, [adminWpp, companies, toast, isLoading]);

  const handleOpenDialog = (company: Company) => {
    if (company.status_pagamento === 'Pago') {
        toast({ variant: 'default', title: 'Acesso já Liberado', description: `A empresa ${company.nome} já tem o pagamento confirmado.` });
        return;
    }
    setSelectedCompany(company);
    setIsDialogOpen(true);
  };

  const handleApproveAccess = async () => {
    if (!selectedCompany) {
      toast({ variant: 'destructive', title: 'Erro Interno', description: 'Nenhuma empresa selecionada.' });
      return;
    }
    if (!paymentMethod) {
      toast({ variant: 'destructive', title: 'Erro de Validação', description: 'Por favor, selecione um método de pagamento.' });
      return;
    }
  
    try {
      let receiptUrl = '';
      if (receipt) {
        const filePath = `${selectedCompany.id}/${receipt.name}`;
  
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, receipt, {
            upsert: true,
          });
  
        if (uploadError) {
          throw new Error(`Falha no upload do comprovante: ${uploadError.message}`);
        }
  
        const { data } = supabase.storage
          .from('receipts')
          .getPublicUrl(filePath);
  
        if (!data?.publicUrl) {
          throw new Error('Não foi possível gerar a URL pública para o comprovante.');
        }
        receiptUrl = data.publicUrl;
      }
  
      const newExpirationDate = format(addMonths(new Date(), 1), 'yyyy-MM-dd');
  
      const { data: updatedCompany, error: updateError } = await supabase
        .from('empresas')
        .update({ status_pagamento: 'Pago', vigencia: newExpirationDate })
        .eq('id', selectedCompany.id)
        .select()
        .single();
  
      if (updateError) {
        throw new Error(`Falha ao atualizar a empresa: ${updateError.message}`);
      }
  
      let acaoString = `Acesso liberado via ${paymentMethod}.`;
      if (receiptUrl) {
        acaoString += ` Comprovante: ${receiptUrl}`;
      }
      if (notes) {
        acaoString += ` Notas: ${notes}`;
      }

      const { error: historyError } = await supabase.from('historico_empresas').insert({
        empresa_id: selectedCompany.id,
        acao: acaoString,
      });
  
      if (historyError) {
        throw new Error(`Falha ao registrar a ação no histórico: ${historyError.message}`);
      }
  
      setCompanies(prev => prev.map(c => c.id === updatedCompany.id ? updatedCompany : c));
  
      const { data: newHistory, error: newHistoryError } = await supabase.from('historico_empresas').select('*, empresas (nome)').eq('empresa_id', selectedCompany.id).order('data', { ascending: false }).limit(1).single();
      if (newHistory && !newHistoryError) {
        setHistory(prev => [newHistory as History, ...prev]);
      }
  
      toast({ title: 'Acesso Liberado!', description: `O acesso para ${selectedCompany.nome} foi liberado.` });
  
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Liberar Acesso',
        description: error.message || 'Ocorreu um erro inesperado.',
        duration: 9000
      });
    } finally {
      setIsDialogOpen(false);
      setSelectedCompany(null);
      setReceipt(null);
      setPaymentMethod('');
      setNotes('');
    }
  };
  
  const handleOpenRevokeDialog = (company: Company) => {
    setCompanyToRevoke(company);
    setIsRevokeDialogOpen(true);
  };

  const handleConfirmRevoke = async () => {
    if (!companyToRevoke) return;
     try {
        const { data, error } = await supabase.from('empresas').update({ status_pagamento: 'Pendente' }).eq('id', companyToRevoke.id).select().single();
        if (error) {
            throw new Error(`Falha ao revogar o acesso: ${error.message}`);
        }
        setCompanies(prev => prev.map(c => c.id === data.id ? data : c));
        toast({ title: 'Acesso Revogado!', description: `O acesso para ${companyToRevoke.nome} foi revogado.`, variant: 'destructive' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro ao Revogar Acesso', description: error.message });
    } finally {
        setIsRevokeDialogOpen(false);
        setCompanyToRevoke(null);
    }
  };

  const handleAddCompany = async () => {
    if (!newCompanyName || !newCompanyCnpj || !newCompanyPlanId || !newCompanyEmail) {
        toast({ variant: 'destructive', title: 'Erro de Validação', description: 'Por favor, preencha todos os campos obrigatórios.' });
        return;
    }
    setIsAddingCompany(true);
    try {
        const result = await inviteCompanyAction({
            newCompanyName,
            newCompanyCnpj,
            newCompanyPlanId,
            newCompanyEmail,
        });

        if (result.success) {
            setCompanies(prev => [...prev, result.company!]);
            toast({ title: 'Convite Enviado!', description: result.message });
            setIsAddCompanyDialogOpen(false);
            setNewCompanyName('');
            setNewCompanyCnpj('');
            setNewCompanyPlanId('');
            setNewCompanyEmail('');
        } else {
            throw new Error(result.error || 'Ocorreu um erro desconhecido.');
        }

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro ao Adicionar Empresa', description: error.message });
    } finally {
        setIsAddingCompany(false);
    }
  };

  const handleOpenChangePlanDialog = (company: Company) => {
    setSelectedCompany(company);
    setNewPlanIdForEdit(company.plano_id?.toString() || '');
    setIsChangePlanDialogOpen(true);
  };

  const handleOpenEditVigenciaDialog = (company: Company) => {
    setSelectedCompany(company);
    setNewVigenciaForEdit(company.vigencia ? parseISO(company.vigencia) : undefined);
    setIsEditVigenciaDialogOpen(true);
  };

  const handleChangePlan = async () => {
    if (!selectedCompany || !newPlanIdForEdit) return;
    try {
      const { data: updatedCompany, error } = await supabase.from('empresas').update({ plano_id: parseInt(newPlanIdForEdit, 10) }).eq('id', selectedCompany.id).select().single();
      if (error) throw new Error(`Falha ao alterar o plano: ${error.message}`);
      setCompanies(prev => prev.map(c => c.id === updatedCompany!.id ? updatedCompany! : c));
      toast({ title: 'Plano Alterado!', description: `O plano da empresa ${selectedCompany.nome} foi atualizado.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao Alterar Plano', description: error.message });
    } finally {
        setIsChangePlanDialogOpen(false);
        setSelectedCompany(null);
    }
  };

  const handleEditVigencia = async () => {
    if (!selectedCompany || !newVigenciaForEdit) return;
    const formattedDate = format(newVigenciaForEdit, 'yyyy-MM-dd');
    try {
      const { data: updatedCompany, error } = await supabase.from('empresas').update({ vigencia: formattedDate }).eq('id', selectedCompany.id).select().single();
      if (error) throw new Error(`Falha ao editar a vigência: ${error.message}`);
      setCompanies(prev => prev.map(c => c.id === updatedCompany!.id ? updatedCompany! : c));
      toast({ title: 'Vigência Alterada!', description: `A vigência da empresa ${selectedCompany.nome} foi atualizada.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao Editar Vigência', description: error.message });
    } finally {
        setIsEditVigenciaDialogOpen(false);
        setSelectedCompany(null);
    }
  };

  const getPlanName = (planId: number | null) => plans.find(p => p.id === planId)?.nome || 'N/A';

  const renderActionCell = (action: string | null) => {
    if (!action) return <span>N/A</span>;
  
    const urlRegex = /Comprovante:\s*(https?:\/\/[^\s]+)/;
    const match = action.match(urlRegex);
  
    if (match && match[1]) {
      let url = match[1];
      // Correção para remover o ponto final da URL, se houver
      if (url.endsWith('.')) {
        url = url.slice(0, -1);
      }
      
      const textBefore = action.substring(0, match.index);
      const textAfter = action.substring(match.index! + match[0].length);
  
      return (
        <span>
          {textBefore}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-primary hover:text-primary/80"
          >
            Comprovante
          </a>
          {textAfter.replace(/^\./, '')}
        </span>
      );
    }
  
    return <span>{action}</span>;
  };

  const handleOpenAddPlanDialog = () => {
    setEditingPlan(null);
    setPlanForm({ nome: '', valor: '', max_funcionarios: '', descricao: '', desconto_anual_percentual: '' });
    setIsAddPlanDialogOpen(true);
  };

  const handleOpenEditPlanDialog = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanForm({
      nome: plan.nome || '',
      valor: plan.valor?.toString() || '',
      max_funcionarios: plan.max_funcionarios?.toString() || '',
      descricao: plan.descricao || '',
      desconto_anual_percentual: plan.desconto_anual_percentual?.toString() || ''
    });
    setIsEditPlanDialogOpen(true);
  };

  const handleSavePlan = async () => {
    if (!planForm.nome || !planForm.valor || !planForm.max_funcionarios) {
        toast({ variant: "destructive", title: "Erro de Validação", description: "Preencha todos os campos do plano." });
        return;
    }
    const planData = {
        nome: planForm.nome,
        valor: parseFloat(planForm.valor),
        max_funcionarios: parseInt(planForm.max_funcionarios, 10),
        descricao: planForm.descricao,
        desconto_anual_percentual: parseFloat(planForm.desconto_anual_percentual) || 0,
    };
    try {
        if (editingPlan) {
            const { data, error } = await supabase.from('planos').update(planData).eq('id', editingPlan.id).select().single();
            if (error) throw new Error(`Falha ao atualizar o plano: ${error.message}`);
            setPlans(plans.map(p => p.id === data!.id ? data! : p));
            toast({ title: "Sucesso!", description: "Plano atualizado com sucesso." });
        } else {
            const { data, error } = await supabase.from('planos').insert(planData).select().single();
            if (error) throw new Error(`Falha ao adicionar o plano: ${error.message}`);
            setPlans([...plans, data!]);
            toast({ title: "Sucesso!", description: "Novo plano adicionado." });
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Erro ao Salvar Plano", description: error.message });
    } finally {
        setIsAddPlanDialogOpen(false);
        setIsEditPlanDialogOpen(false);
        setEditingPlan(null);
    }
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center">
                <p>Carregando dados do administrador...</p>
            </div>
        </div>
    );
  }

  return (
    <>
      <div className="flex flex-row items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold leading-none tracking-tight">Painel do Administrador Master</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Gerencie todas as empresas e planos cadastrados na plataforma.
          </p>
        </div>
        <Button onClick={() => setIsAddCompanyDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Empresa
        </Button>
      </div>
      
      <Tabs defaultValue="companies">
        <TabsList className="mb-4 grid w-full grid-cols-3">
            <TabsTrigger value="companies">Empresas</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="companies">
            <Card>
            <CardContent className="p-0">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome da Empresa</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {companies.length > 0 ? companies.map((company) => (
                    <TableRow key={company.id}>
                        <TableCell>{company.id.substring(0,6)}...</TableCell>
                        <TableCell className="font-medium">{company.nome}</TableCell>
                        <TableCell>{company.cnpj}</TableCell>
                        <TableCell>{getPlanName(company.plano_id)}</TableCell>
                        <TableCell>
                        <Badge variant={getStatusVariant(company.status_pagamento)}>
                            {company.status_pagamento}
                        </Badge>
                        </TableCell>
                         <TableCell className={isExpiringSoon(company.vigencia) ? 'text-destructive font-medium' : ''}>
                           {company.vigencia ? format(parseISO(company.vigencia), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
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
                            <DropdownMenuItem onSelect={() => handleOpenDialog(company)}>
                                Liberar Acesso
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleOpenChangePlanDialog(company)}>
                                Alterar Plano
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleOpenEditVigenciaDialog(company)}>
                                Editar Vigência
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onSelect={() => handleOpenRevokeDialog(company)}>
                              Revogar Acesso
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    )) : (
                        <TableRow>
                           <TableCell colSpan={7} className="h-24 text-center">
                            Nenhuma empresa encontrada. Adicione uma para começar.
                           </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="plans">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Gerenciamento de Planos</CardTitle>
                            <CardDescription>Adicione, edite e gerencie os planos de assinatura.</CardDescription>
                        </div>
                        <Button onClick={handleOpenAddPlanDialog}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar Plano
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome do Plano</TableHead>
                                <TableHead>Valor (R$)</TableHead>
                                <TableHead>Desconto Anual</TableHead>
                                <TableHead>Nº de Funcionários</TableHead>
                                <TableHead>Forma de Cobrança</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plans.length > 0 ? plans.map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell className="font-medium">{plan.nome}</TableCell>
                                    <TableCell>R$ {plan.valor}</TableCell>
                                    <TableCell>{plan.desconto_anual_percentual || 0}%</TableCell>
                                    <TableCell>{plan.max_funcionarios === 0 ? 'Ilimitado' : plan.max_funcionarios}</TableCell>
                                    <TableCell>{plan.descricao}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditPlanDialog(plan)}>
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Editar Plano</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Nenhum plano encontrado. Adicione um para começar.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="history">
             <Card>
                <CardHeader>
                    <CardTitle>Histórico de Ações</CardTitle>
                    <CardDescription>
                        Registro de todas as ações importantes realizadas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Ação</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.length > 0 ? (
                                history.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell className="font-medium">{entry.empresas?.nome || 'N/A'}</TableCell>
                                        <TableCell>{entry.data ? format(parseISO(entry.data), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'}</TableCell>
                                        <TableCell>{renderActionCell(entry.acao)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-12">
                                        Nenhum registro de histórico encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
        </TabsContent>
      </Tabs>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Configurações de Notificação</CardTitle>
          <CardDescription>
            Cadastre seu número de WhatsApp para receber simulações de alertas de expiração de planos nesta tela.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-grow w-full sm:w-auto">
            <Label htmlFor="wpp-input">Seu Número de WhatsApp</Label>
            <Input
              id="wpp-input"
              type="tel"
              placeholder="(99) 99999-9999"
              value={tempWpp}
              onChange={(e) => setTempWpp(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button onClick={handleSaveWpp} className="w-full sm:w-auto mt-4 sm:mt-0 self-end">Salvar Número</Button>
        </CardContent>
        {adminWpp && (
            <CardContent className="pt-0 text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>As simulações de notificação serão exibidas para o número: <strong>{adminWpp}</strong></span>
            </CardContent>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>Liberar Acesso para {selectedCompany?.nome}</DialogTitle>
                  <DialogDescription>
                      Confirme o pagamento recebido fora da plataforma para liberar o acesso.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="payment-method" className="text-right">
                          Método
                      </Label>
                       <Select onValueChange={setPaymentMethod} value={paymentMethod}>
                          <SelectTrigger id="payment-method" className="col-span-3">
                              <SelectValue placeholder="Selecione o método" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="PIX">PIX</SelectItem>
                              <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                              <SelectItem value="Transferência">Transferência Bancária</SelectItem>
                              <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="notes" className="text-right">
                          Notas
                      </Label>
                      <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="col-span-3"
                          placeholder="Notas adicionais (opcional)"
                      />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="receipt" className="text-right">
                          Comprovante
                      </Label>
                      <Input
                          id="receipt"
                          type="file"
                          className="col-span-3"
                          onChange={(e) => setReceipt(e.target.files ? e.target.files[0] : null)}
                      />
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                       <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button onClick={handleApproveAccess}>Confirmar Liberação</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <AlertDialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação revogará o acesso da empresa "{companyToRevoke?.nome}". O status do pagamento será alterado para "Pendente".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleConfirmRevoke}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                    Confirmar Revogação
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isAddCompanyDialogOpen} onOpenChange={setIsAddCompanyDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Adicionar Nova Empresa</DialogTitle>
                <DialogDescription>
                    Preencha os detalhes para enviar um convite de cadastro para a nova empresa.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="company-name" className="text-right">
                        Nome
                    </Label>
                    <Input
                        id="company-name"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        className="col-span-3"
                        placeholder="Nome da Empresa"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="company-cpf-cnpj" className="text-right">
                        CPF ou CNPJ
                    </Label>
                    <Input
                        id="company-cpf-cnpj"
                        value={newCompanyCnpj}
                        onChange={(e) => setNewCompanyCnpj(e.target.value)}
                        className="col-span-3"
                        placeholder="Seu CPF ou CNPJ"
                    />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="company-email" className="text-right">
                        Email
                    </Label>
                    <Input
                        id="company-email"
                        type="email"
                        value={newCompanyEmail}
                        onChange={(e) => setNewCompanyEmail(e.target.value)}
                        className="col-span-3"
                        placeholder="Email de contato da empresa"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="company-plan" className="text-right">
                        Plano
                    </Label>
                     <Select onValueChange={setNewCompanyPlanId} value={newCompanyPlanId}>
                        <SelectTrigger id="company-plan" className="col-span-3">
                            <SelectValue placeholder="Selecione o plano" />
                        </SelectTrigger>
                        <SelectContent>
                            {plans.map(plan => (
                                <SelectItem key={plan.id} value={plan.id.toString()}>
                                    {plan.nome}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                     <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleAddCompany} disabled={isAddingCompany}>
                  {isAddingCompany ? "Convidando..." : "Convidar Empresa"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isChangePlanDialogOpen} onOpenChange={setIsChangePlanDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Alterar Plano de {selectedCompany?.nome}</DialogTitle>
                <DialogDescription>
                    Selecione o novo plano para a empresa. A alteração será imediata.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-plan" className="text-right">
                        Plano
                    </Label>
                    <Select onValueChange={setNewPlanIdForEdit} value={newPlanIdForEdit}>
                        <SelectTrigger id="edit-plan" className="col-span-3">
                            <SelectValue placeholder="Selecione o plano" />
                        </SelectTrigger>
                        <SelectContent>
                            {plans.map(plan => (
                                <SelectItem key={plan.id} value={plan.id.toString()}>
                                    {plan.nome}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                     <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleChangePlan}>Salvar Alterações</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditVigenciaDialogOpen} onOpenChange={setIsEditVigenciaDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Editar Vigência de {selectedCompany?.nome}</DialogTitle>
                <DialogDescription>
                    Selecione a nova data de expiração para o plano da empresa.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                     <Label className="text-right">
                        Data
                     </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "col-span-3 justify-start text-left font-normal",
                                !newVigenciaForEdit && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newVigenciaForEdit ? format(newVigenciaForEdit, "dd/MM/yyyy") : <span>Escolha uma data</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={newVigenciaForEdit}
                                onSelect={setNewVigenciaForEdit}
                                initialFocus
                            />
                        </PopoverContent>
                      </Popover>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                     <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleEditVigencia}>Salvar Data</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddPlanDialogOpen || isEditPlanDialogOpen} onOpenChange={editingPlan ? setIsEditPlanDialogOpen : setIsAddPlanDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>{editingPlan ? "Editar Plano" : "Adicionar Novo Plano"}</DialogTitle>
                  <DialogDescription>
                      {editingPlan ? "Altere os detalhes do plano." : "Preencha os detalhes do novo plano."}
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="plan-name" className="text-right">Nome</Label>
                      <Input id="plan-name" value={planForm.nome} onChange={(e) => setPlanForm({...planForm, nome: e.target.value})} className="col-span-3" placeholder="Ex: Básico" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="plan-value" className="text-right">Valor (R$)</Label>
                      <Input id="plan-value" type="number" value={planForm.valor} onChange={(e) => setPlanForm({...planForm, valor: e.target.value})} className="col-span-3" placeholder="Ex: 49.90" />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="plan-discount" className="text-right">Desconto Anual (%)</Label>
                      <Input id="plan-discount" type="number" value={planForm.desconto_anual_percentual} onChange={(e) => setPlanForm({...planForm, desconto_anual_percentual: e.target.value})} className="col-span-3" placeholder="Ex: 10" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="plan-employees" className="text-right">Funcionários</Label>
                      <Input id="plan-employees" type="number" value={planForm.max_funcionarios} onChange={(e) => setPlanForm({...planForm, max_funcionarios: e.target.value})} className="col-span-3" placeholder="Ex: 10 (0 para ilimitado)" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="plan-billing" className="text-right">Cobrança</Label>
                       <Select onValueChange={(value) => setPlanForm({...planForm, descricao: value})} value={planForm.descricao}>
                          <SelectTrigger id="plan-billing" className="col-span-3">
                              <SelectValue placeholder="Selecione a forma" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Mensal">Mensal</SelectItem>
                              <SelectItem value="Anual">Anual</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                       <Button variant="outline" onClick={() => editingPlan ? setIsEditPlanDialogOpen(false) : setIsAddPlanDialogOpen(false)}>Cancelar</Button>
                  </DialogClose>
                  <Button onClick={handleSavePlan}>Salvar Plano</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
