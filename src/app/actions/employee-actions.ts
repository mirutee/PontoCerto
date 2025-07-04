
'use server';

import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/models';

const createEmployeeSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1, 'Nome do funcionário é obrigatório.'),
  email: z.string().email('Email inválido.'),
  cpf: z.string().min(1, 'CPF é obrigatório.'),
  cargo: z.string().min(1, 'Cargo é obrigatório.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

const updateEmployeeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Nome do funcionário é obrigatório.'),
  cargo: z.string().min(1, 'Cargo é obrigatório.'),
  cpf: z.string().min(1, 'CPF é obrigatório.'),
});

const toggleEmployeeStatusSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(['Ativo', 'Inativo']),
});


export async function createEmployeeAction(input: z.infer<typeof createEmployeeSchema>) {
  const validation = createEmployeeSchema.safeParse(input);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors).flat()[0] || 'Erro de validação.';
    return { success: false, message: firstError };
  }

  const { companyId, name, email, cpf, cargo, password } = validation.data;

  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
      },
    });

    if (authError) {
      if (authError.message.includes('User already registered')) {
         return { success: false, message: 'Este email já está cadastrado no sistema.' };
      }
      throw new Error(`Falha ao criar usuário na autenticação: ${authError.message}`);
    }
    if (!user) throw new Error("Usuário não foi criado no sistema de autenticação.");
    
    const userId = user.id;

    const { error: profileError } = await supabaseAdmin.from('usuarios').insert({
      id: userId,
      nome: name,
      email: email,
      tipo: 'funcionario',
      cnpj: cpf, // Using cnpj field for CPF
    });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Falha ao criar perfil de usuário: ${profileError.message}`);
    }

    const newEmployeeData: Database['public']['Tables']['funcionarios']['Insert'] = {
        id: userId,
        empresa_id: companyId,
        nome: name,
        email: email,
        cargo: cargo,
        status: 'Ativo',
    };

    const { data: employeeData, error: employeeError } = await supabaseAdmin
      .from('funcionarios')
      .insert(newEmployeeData)
      .select()
      .single();

    if (employeeError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Falha ao criar registro do funcionário: ${employeeError.message}`);
    }

    return { success: true, message: 'Funcionário adicionado com sucesso!', employee: employeeData };

  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function updateEmployeeAction(input: z.infer<typeof updateEmployeeSchema>) {
    const validation = updateEmployeeSchema.safeParse(input);
    if (!validation.success) {
        const firstError = Object.values(validation.error.flatten().fieldErrors).flat()[0] || 'Erro de validação.';
        return { success: false, message: firstError };
    }
    const { id, name, cargo, cpf } = validation.data;
    
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            throw new Error('Usuário não autenticado.');
        }

        const { data: employeeData, error: employeeError } = await supabase
            .from('funcionarios')
            .update({ nome: name, cargo: cargo })
            .eq('id', id)
            .select()
            .single();

        if (employeeError) throw new Error(`Falha ao atualizar dados do funcionário: ${employeeError.message}`);

        const { error: userError } = await supabase
            .from('usuarios')
            .update({ nome: name, cnpj: cpf }) // Storing CPF in 'cnpj' field
            .eq('id', id);
        
        if (userError) {
            console.error(`Inconsistência: falha ao atualizar nome/cpf na tabela de usuários para o ID ${id}`);
        }

        return { success: true, message: 'Funcionário atualizado com sucesso!', employee: employeeData };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function toggleEmployeeStatusAction(input: z.infer<typeof toggleEmployeeStatusSchema>) {
    const validation = toggleEmployeeStatusSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, message: 'Erro de validação de dados.' };
    }
    const { id, status } = validation.data;
    const newStatus = status === 'Ativo' ? 'Inativo' : 'Ativo';

    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            throw new Error('Usuário não autenticado.');
        }

        const { data: employeeData, error } = await supabase
            .from('funcionarios')
            .update({ status: newStatus })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Falha ao alterar o status do funcionário: ${error.message}`);
        
        return { success: true, message: `Status do funcionário alterado para ${newStatus}.`, employee: employeeData };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
