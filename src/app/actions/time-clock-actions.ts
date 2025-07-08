
'use server';

import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { format } from 'date-fns';
import type { Database } from '@/lib/supabase/models';

type PointRecordInsert =
  Database['public']['Tables']['ponto_funcionarios']['Insert'];
type PointRecordUpdate =
  Database['public']['Tables']['ponto_funcionarios']['Update'];

const registerTimeClockSchema = z.object({
  actionType: z.enum(['in', 'out']),
  photoDataUrl: z.string().nullable(),
  justification: z.string().nullable(),
});

async function uploadPhoto(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  photoDataUrl: string
) {
  const base64Data = photoDataUrl.split(';base64,').pop();
  if (!base64Data) {
    throw new Error('Formato de imagem inválido.');
  }

  const imageBuffer = Buffer.from(base64Data, 'base64');
  const filePath = `public/${userId}/${new Date().toISOString()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('time-clock-photos')
    .upload(filePath, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (uploadError) {
    console.error('Supabase Storage Error:', uploadError);
    throw new Error(`Falha no Upload da Foto: ${uploadError.message}. Verifique as permissões do bucket 'time-clock-photos'.`);
  }

  const { data: urlData } = supabase.storage
    .from('time-clock-photos')
    .getPublicUrl(filePath);
  return urlData.publicUrl;
}

export async function registerTimeClockAction(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const rawData = {
    actionType: formData.get('actionType') as 'in' | 'out',
    photoDataUrl: formData.get('photoDataUrl') as string | null,
    justification: formData.get('justification') as string | null,
  };

  const validation = registerTimeClockSchema.safeParse(rawData);

  if (!validation.success) {
    return { success: false, message: 'Dados de entrada inválidos.' };
  }
  const { actionType, photoDataUrl, justification } = validation.data;

  if (!photoDataUrl && !(justification && justification.trim())) {
    return {
      success: false,
      message: 'É necessário uma foto ou uma justificativa válida.',
    };
  }

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Usuário não autenticado. A sessão pode ter expirado.');
    }
    const userId = session.user.id;
    const now = new Date();
    let photoUrl = null;

    if (photoDataUrl) {
      photoUrl = await uploadPhoto(supabase, userId, photoDataUrl);
    }

    if (actionType === 'in') {
      const newPointRecord: PointRecordInsert = {
        funcionario_id: userId,
        data: format(now, 'yyyy-MM-dd'),
        hora_entrada: format(now, 'HH:mm:ss'),
        status: 'Aberto',
        foto_entrada_url: photoUrl,
        observacao_entrada: justification,
      };

      const { error: insertError } = await supabase
        .from('ponto_funcionarios')
        .insert(newPointRecord);
        
      if (insertError) {
        console.error('Supabase Insert Error:', insertError);
        throw new Error(`Falha ao Salvar no BD: ${insertError.message}. Verifique as permissões (RLS) da tabela 'ponto_funcionarios'.`);
      }
      return {
        success: true,
        message: `Entrada registrada às ${format(now, 'HH:mm')}.`,
        data: { type: 'in', time: now.toISOString() }
      };
    } else {
      // actionType === 'out'
      const { data: lastEntry, error: lastEntryError } = await supabase
        .from('ponto_funcionarios')
        .select('id')
        .eq('funcionario_id', userId)
        .eq('status', 'Aberto')
        .order('data', { ascending: false })
        .order('hora_entrada', { ascending: false })
        .limit(1)
        .single();

      if (lastEntryError || !lastEntry) {
        throw new Error(
          'Nenhum registro de entrada aberto encontrado para registrar a saída.'
        );
      }

      const updateData: PointRecordUpdate = {
        hora_saida: format(now, 'HH:mm:ss'),
        foto_saida_url: photoUrl,
        observacao_saida: justification,
        status: 'Concluído',
      };

      const { error: updateError } = await supabase
        .from('ponto_funcionarios')
        .update(updateData)
        .eq('id', lastEntry.id);

      if (updateError) {
        console.error('Supabase Update Error:', updateError);
        throw new Error(`Falha ao Atualizar no BD: ${updateError.message}. Verifique as permissões (RLS) para atualização.`);
      }
      return {
        success: true,
        message: `Saída registrada às ${format(now, 'HH:mm')}.`,
        data: { type: 'out' }
      };
    }
  } catch (error: any) {
    console.error('Register Time Clock Action Error:', error);
    return { success: false, message: error.message };
  }
}

export async function getClockStatus() {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { clockedIn: false, lastCheckInTime: null };
    }

    const { data: lastEntry } = await supabase
      .from('ponto_funcionarios')
      .select('hora_entrada, data')
      .eq('funcionario_id', session.user.id)
      .eq('status', 'Aberto')
      .order('data', { ascending: false })
      .order('hora_entrada', { ascending: false })
      .limit(1)
      .single();

    if (lastEntry) {
        const checkInDateTime = new Date(`${lastEntry.data}T${lastEntry.hora_entrada}`);
        return { clockedIn: true, lastCheckInTime: checkInDateTime.toISOString() };
    }

    return { clockedIn: false, lastCheckInTime: null };
}
