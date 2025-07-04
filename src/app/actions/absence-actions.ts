'use server';

import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';

const createAbsenceRequestSchema = z.object({
  timeOffType: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
  justification: z.string(),
  attachment: z.instanceof(File).optional(),
});

export async function createAbsenceRequestAction(formData: FormData) {
  const rawData = {
    timeOffType: formData.get('timeOffType'),
    startDate: new Date(formData.get('startDate') as string),
    endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : undefined,
    justification: formData.get('justification'),
    attachment: formData.get('attachment'),
  };

  const validation = createAbsenceRequestSchema.safeParse(rawData);

  if (!validation.success) {
    return { success: false, message: 'Dados inválidos: ' + validation.error.flatten().fieldErrors };
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
        .from('documents') // Assuming a 'documents' bucket exists
        .upload(filePath, attachment);

      if (uploadError) {
        throw new Error(`Falha no upload do documento: ${uploadError.message}`);
      }
      
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
      documentUrl = urlData.publicUrl;
    }

    const { error: insertError } = await supabase.from('faltas_programadas').insert({
      funcionario_id: userId,
      empresa_id: companyId,
      tipo: timeOffType,
      data_inicio: format(startDate, 'yyyy-MM-dd'),
      data_fim: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      motivo: justification,
      documento_link: documentUrl,
      status_aprovacao: 'Pendente',
    });

    if (insertError) {
      throw new Error(`Falha ao criar solicitação: ${insertError.message}`);
    }

    return { success: true, message: 'Solicitação de ausência enviada com sucesso!' };

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
