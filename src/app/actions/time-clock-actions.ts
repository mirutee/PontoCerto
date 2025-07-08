'use server';

import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { format } from 'date-fns';
import type { Database } from '@/lib/supabase/models';

type PointRecordInsert = Database['public']['Tables']['ponto_funcionarios']['Insert'];

const registerTimeClockSchema = z.object({
  photoDataUrl: z.string().optional(),
  justification: z.string().optional(),
});

export async function registerTimeClockAction(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const rawData = {
    photoDataUrl: formData.get('photoDataUrl') as string | undefined,
    justification: formData.get('justification') as string | undefined,
  };

  const validation = registerTimeClockSchema.safeParse(rawData);

  if (!validation.success) {
    return { success: false, message: 'Dados de entrada inválidos.' };
  }
  
  const { photoDataUrl, justification } = validation.data;

  if (!photoDataUrl && !justification) {
      return { success: false, message: 'É necessário uma foto ou uma justificativa.' };
  }

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Usuário não autenticado.');
    }
    const userId = session.user.id;

    let photoUrl = null;
    if (photoDataUrl) {
        const base64Data = photoDataUrl.split(';base64,').pop();
        if (!base64Data) {
            throw new Error('Formato de imagem inválido.');
        }

        const imageBuffer = Buffer.from(base64Data, 'base64');
        const filePath = `time_clock_photos/${userId}/${new Date().toISOString()}.jpg`;

        const { error: uploadError } = await supabase.storage
            .from('time-clock-photos') // Use a bucket dedicated for this
            .upload(filePath, imageBuffer, {
                contentType: 'image/jpeg',
                upsert: true,
            });

        if (uploadError) {
            throw new Error(`Falha no upload da foto: ${uploadError.message}`);
        }
        
        const { data: urlData } = supabase.storage.from('time-clock-photos').getPublicUrl(filePath);
        photoUrl = urlData.publicUrl;
    }

    const now = new Date();
    const newPointRecord: PointRecordInsert = {
        funcionario_id: userId,
        data: format(now, 'yyyy-MM-dd'),
        hora_entrada: format(now, 'HH:mm:ss'),
        status: 'Pendente', // You can adjust this status as needed
        foto_entrada_url: photoUrl,
        observacao_entrada: justification,
    };

    const { error: insertError } = await supabase
      .from('ponto_funcionarios')
      .insert(newPointRecord);

    if (insertError) {
      throw new Error(`Falha ao registrar o ponto: ${insertError.message}`);
    }

    return { success: true, message: `Entrada registrada às ${format(now, 'HH:mm')}.` };

  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
