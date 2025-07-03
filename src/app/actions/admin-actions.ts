'use server';

import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/models';
import { format, addMonths } from 'date-fns';

type CompanyInsert = Database['public']['Tables']['empresas']['Insert'];

const inviteCompanySchema = z.object({
  newCompanyName: z.string().min(1, 'Nome da empresa é obrigatório.'),
  newCompanyCnpj: z.string().min(1, 'CNPJ é obrigatório.'),
  newCompanyPlanId: z.string().min(1, 'Plano é obrigatório.'),
  newCompanyEmail: z.string().email('Email inválido.'),
});

export async function inviteCompanyAction(input: z.infer<typeof inviteCompanySchema>) {
  const validation = inviteCompanySchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  const { newCompanyName, newCompanyCnpj, newCompanyPlanId, newCompanyEmail } = validation.data;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    return { success: false, error: 'A variável de ambiente NEXT_PUBLIC_SITE_URL não está configurada. O convite não pode ser enviado. Adicione-a nas configurações do ambiente de produção.' };
  }

  try {
    const { data: { user }, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      newCompanyEmail,
      { 
        data: { full_name: newCompanyName },
        redirectTo: `${siteUrl}/login`
      }
    );

    if (inviteError) {
       if (inviteError.message.includes('User already registered')) {
         return { success: false, error: 'Este email já está cadastrado no sistema de autenticação.' };
      }
      throw new Error(`Falha ao convidar usuário: ${inviteError.message}`);
    }

    if (!user) {
      throw new Error("Usuário não foi criado no sistema de autenticação.");
    }
    const userId = user.id;
    
    const { error: profileError } = await supabase.from('usuarios').insert({
      id: userId,
      nome: newCompanyName,
      email: newCompanyEmail,
      tipo: 'empresa',
      cnpj: newCompanyCnpj
    });

    if (profileError) {
      // If creating the profile fails, we should delete the auth user to avoid orphans.
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Falha ao criar perfil de usuário: ${profileError.message}`);
    }
    
    const newCompanyData: CompanyInsert = {
      nome: newCompanyName,
      cnpj: newCompanyCnpj,
      plano_id: parseInt(newCompanyPlanId, 10),
      status_pagamento: 'Pendente',
      vigencia: format(addMonths(new Date(), 1), 'yyyy-MM-dd')
    };

    const { data: companyData, error: companyError } = await supabase
      .from('empresas')
      .insert(newCompanyData)
      .select()
      .single();

    if (companyError) {
      // If creating the company fails, delete the auth user and profile
      await supabaseAdmin.auth.admin.deleteUser(userId);
      // The profile might cascade delete, but an explicit delete is safer.
      // We don't have a direct way to delete profile here without its id, but user deletion should be enough.
      throw new Error(`Falha ao criar empresa: ${companyError.message}`);
    }
    
    return { success: true, message: `Um e-mail de convite foi enviado para ${newCompanyEmail}.`, company: companyData };

  } catch (error: any) {
    // This will catch any thrown errors from the try block
    return { success: false, error: error.message };
  }
}
