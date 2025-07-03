'use server';

import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/models';

const createEmployeeSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1, 'Nome do funcionário é obrigatório.'),
  email: z.string().email('Email inválido.'),
  cpf: z.string().min(1, 'CPF é obrigatório.'),
  cargo: z.string().min(1, 'Cargo é obrigatório.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
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
    // 1. Create the user in Supabase Auth
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email since the company is creating the account
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

    // 2. Create the user profile in 'usuarios' table
    const { error: profileError } = await supabase.from('usuarios').insert({
      id: userId,
      nome: name,
      email: email,
      tipo: 'funcionario',
      cnpj: cpf, // Using cnpj field for CPF
    });

    if (profileError) {
      // Rollback: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Falha ao criar perfil de usuário: ${profileError.message}`);
    }

    // 3. Create the employee record in 'funcionarios' table
    const newEmployeeData: Database['public']['Tables']['funcionarios']['Insert'] = {
        id: userId,
        empresa_id: companyId,
        nome: name,
        email: email,
        cargo: cargo,
        status: 'Ativo',
    };

    const { data: employeeData, error: employeeError } = await supabase
      .from('funcionarios')
      .insert(newEmployeeData)
      .select()
      .single();

    if (employeeError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Falha ao criar registro do funcionário: ${employeeError.message}`);
    }

    return { success: true, message: 'Funcionário adicionado com sucesso!', employee: employeeData };

  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
