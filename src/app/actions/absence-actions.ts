'use server';

import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';
import type { Database } from '@/lib/supabase/models';

type AbsenceRequest = Database['public']['Tables']['faltas_programadas']['Row'];

const createAbsenceRequestSchema = z.object({
  timeOffType: z.string().min(1, 'O tipo de folga é obrigatório.'),
  startDate: z.date({ errorMap: () => ({ message: 'A data de início é obrigatória.' }) }),
  endDate: z.date().optional(),
  justification: z.string().min(10, 'A justificativa precisa ter pelo menos 10 caracteres.'),
  attachment: z.instanceof(File).optional(),
});

export async function createAbsenceRequestAction(formData: FormData): Promise<{
    success: boolean;
    message: string;
    data?: AbsenceRequest;
}> {
  const attachmentFile = formData.get('attachment');
  
  const rawData = {
    timeOffType: formData.get('timeOffType') as string,
    startDate: new Date(formData.get('startDate') as string),
    endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : undefined,
    justification: formData.get('justification') as string,
    attachment: attachmentFile instanceof File && attachmentFile.size > 0 ? attachmentFile : undefined,
  };

  const validation = createAbsenceRequestSchema.safeParse(rawData);

  if (!validation.success) {
    const firstError = Object.values(validation.error.flatten().fieldErrors).flat()[0];
    return { success: false, message: `Dados inválidos: ${firstError || 'Verifique os campos do formulário.'}` };
  }

  const { timeOffType, startDate, endDate, justification, attachment } = validation.data;

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Usuário não autenticado.');
    }
    const userId = session.user.id;

    const { data: employeeData, error: employeeError } = await supabase
      .from('funcionarios')
      .select('empresa_id')
      .eq('id', userId)
      .single();

    if (employeeError || !employeeData) {
      throw new Error('Funcionário não encontrado.');
    }
    const companyId = employeeData.empresa_id;
    if (!companyId) {
        throw new Error('Funcionário não está associado a nenhuma empresa.');
    }

    let documentUrl = null;
    if (attachment && attachment.size > 0) {
      const filePath = `absence_requests/${userId}/${Date.now()}_${attachment.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, attachment);

      if (uploadError) {
        throw new Error(`Falha no upload do documento: ${uploadError.message}`);
      }
      
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
      documentUrl = urlData.publicUrl;
    }

    const { data: newRequest, error: insertError } = await supabase.from('faltas_programadas').insert({
      funcionario_id: userId,
      empresa_id: companyId,
      tipo: timeOffType,
      data_inicio: format(startDate, 'yyyy-MM-dd'),
      data_fim: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      motivo: justification,
      documento_link: documentUrl,
      status_aprovacao: 'Pendente',
    }).select().single();

    if (insertError) {
      throw new Error(`Falha ao criar solicitação: ${insertError.message}`);
    }

    return { success: true, message: 'Solicitação de ausência enviada com sucesso!', data: newRequest };

  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function updateAbsenceRequestStatus(requestId: number, newStatus: 'Aprovado' | 'Rejeitado') {
    try {
        const { error } = await supabase
            .from('faltas_programadas')
            .update({ status_aprovacao: newStatus })
            .eq('id', requestId);

        if (error) throw new Error(`Falha ao atualizar status: ${error.message}`);
        
        return { success: true, message: `Solicitação ${newStatus.toLowerCase()} com sucesso.` };

    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
