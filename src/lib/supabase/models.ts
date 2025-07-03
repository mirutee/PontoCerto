export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      calendario_ocorrencias: {
        Row: {
          data: string | null
          funcionario_id: string | null
          id: number
          observacao: string | null
          tipo: string | null
        }
        Insert: {
          data?: string | null
          funcionario_id?: string | null
          id?: number
          observacao?: string | null
          tipo?: string | null
        }
        Update: {
          data?: string | null
          funcionario_id?: string | null
          id?: number
          observacao?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendario_ocorrencias_funcionario_id_fkey"
            columns: ["funcionario_id"]
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          }
        ]
      }
      config_admin: {
        Row: {
          chave: string | null
          id: number
          valor: string | null
        }
        Insert: {
          chave?: string | null
          id?: number
          valor?: string | null
        }
        Update: {
          chave?: string | null
          id?: number
          valor?: string | null
        }
        Relationships: []
      }
      config_empresas: {
        Row: {
          empresa_id: string | null
          id: number
          chave: string | null
          valor: string | null
        }
        Insert: {
          empresa_id?: string | null
          id?: number
          chave?: string | null
          valor?: string | null
        }
        Update: {
          empresa_id?: string | null
          id?: number
          chave?: string | null
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          }
        ]
      }
      config_funcionarios: {
        Row: {
          funcionario_id: string | null
          id: number
          chave: string | null
          valor: string | null
        }
        Insert: {
          funcionario_id?: string | null
          id?: number
          chave?: string | null
          valor?: string | null
        }
        Update: {
          funcionario_id?: string | null
          id?: number
          chave?: string | null
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_funcionarios_funcionario_id_fkey"
            columns: ["funcionario_id"]
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          }
        ]
      }
      documentos_funcionarios: {
        Row: {
          criado_em: string | null
          funcionario_id: string | null
          id: number
          link_arquivo: string | null
          nome_arquivo: string | null
          status_aprovacao: string | null
          tipo_arquivo: string | null
        }
        Insert: {
          criado_em?: string | null
          funcionario_id?: string | null
          id?: number
          link_arquivo?: string | null
          nome_arquivo?: string | null
          status_aprovacao?: string | null
          tipo_arquivo?: string | null
        }
        Update: {
          criado_em?: string | null
          funcionario_id?: string | null
          id?: number
          link_arquivo?: string | null
          nome_arquivo?: string | null
          status_aprovacao?: string | null
          tipo_arquivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_funcionarios_funcionario_id_fkey"
            columns: ["funcionario_id"]
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          }
        ]
      }
      empresas: {
        Row: {
          id: string
          nome: string | null
          cnpj: string | null
          plano_id: number | null
          status_pagamento: string | null
          vigencia: string | null
        }
        Insert: {
          id?: string
          nome?: string | null
          cnpj?: string | null
          plano_id?: number | null
          status_pagamento?: string | null
          vigencia?: string | null
        }
        Update: {
          id?: string
          nome?: string | null
          cnpj?: string | null
          plano_id?: number | null
          status_pagamento?: string | null
          vigencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresas_plano_id_fkey"
            columns: ["plano_id"]
            referencedRelation: "planos"
            referencedColumns: ["id"]
          }
        ]
      }
      faltas_programadas: {
        Row: {
          id: number
          funcionario_id: string
          empresa_id: string
          tipo: string
          data_inicio: string
          data_fim: string | null
          motivo: string
          documento_link: string | null
          status_aprovacao: string
          criado_em: string
        }
        Insert: {
          id?: number
          funcionario_id: string
          empresa_id: string
          tipo: string
          data_inicio: string
          data_fim?: string | null
          motivo: string
          documento_link?: string | null
          status_aprovacao?: string
          criado_em?: string
        }
        Update: {
          id?: number
          funcionario_id?: string
          empresa_id?: string
          tipo?: string
          data_inicio?: string
          data_fim?: string | null
          motivo?: string
          documento_link?: string | null
          status_aprovacao?: string
          criado_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "faltas_programadas_empresa_id_fkey"
            columns: ["empresa_id"]
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faltas_programadas_funcionario_id_fkey"
            columns: ["funcionario_id"]
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          }
        ]
      }
      funcionarios: {
        Row: {
          cargo: string | null
          criado_em: string | null
          email: string | null
          empresa_id: string | null
          id: string
          nome: string | null
          status: string | null
          telefone: string | null
        }
        Insert: {
          cargo?: string | null
          criado_em?: string | null
          email?: string | null
          empresa_id?: string | null
          id: string
          nome?: string | null
          status?: string | null
          telefone?: string | null
        }
        Update: {
          cargo?: string | null
          criado_em?: string | null
          email?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string | null
          status?: string | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_empresa_id_fkey"
            columns: ["empresa_id"]
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_id_fkey"
            columns: ["id"]
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          }
        ]
      }
      historico_admin: {
        Row: {
          acao: string | null
          data: string | null
          id: number
          usuario_id: string | null
        }
        Insert: {
          acao?: string | null
          data?: string | null
          id?: number
          usuario_id?: string | null
        }
        Update: {
          acao?: string | null
          data?: string | null
          id?: number
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_admin_usuario_id_fkey"
            columns: ["usuario_id"]
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          }
        ]
      }
      historico_empresas: {
        Row: {
          acao: string | null
          data: string | null
          empresa_id: string | null
          id: number
        }
        Insert: {
          acao?: string | null
          data?: string | null
          empresa_id?: string | null
          id?: number
        }
        Update: {
          acao?: string | null
          data?: string | null
          empresa_id?: string | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "historico_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          }
        ]
      }
      historico_funcionarios: {
        Row: {
          acao: string | null
          data: string | null
          funcionario_id: string | null
          id: number
        }
        Insert: {
          acao?: string | null
          data?: string | null
          funcionario_id?: string | null
          id?: number
        }
        Update: {
          acao?: string | null
          data?: string | null
          funcionario_id?: string | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "historico_funcionarios_funcionario_id_fkey"
            columns: ["funcionario_id"]
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          }
        ]
      }
      notificacoes: {
        Row: {
          conteudo: string | null
          data_envio: string | null
          destinatario_id: string | null
          id: number
          meio: string | null
          tipo: string | null
        }
        Insert: {
          conteudo?: string | null
          data_envio?: string | null
          destinatario_id?: string | null
          id?: number
          meio?: string | null
          tipo?: string | null
        }
        Update: {
          conteudo?: string | null
          data_envio?: string | null
          destinatario_id?: string | null
          id?: number
          meio?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      pagamentos_stripe: {
        Row: {
          data_pagamento: string | null
          empresa_id: string | null
          id: number
          status: string | null
          stripe_id: string | null
          tipo: string | null
          valor: number | null
        }
        Insert: {
          data_pagamento?: string | null
          empresa_id?: string | null
          id?: number
          status?: string | null
          stripe_id?: string | null
          tipo?: string | null
          valor?: number | null
        }
        Update: {
          data_pagamento?: string | null
          empresa_id?: string | null
          id?: number
          status?: string | null
          stripe_id?: string | null
          tipo?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_stripe_empresa_id_fkey"
            columns: ["empresa_id"]
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          }
        ]
      }
      planos: {
        Row: {
          id: number
          nome: string
          valor: number | null
          max_funcionarios: number | null
          descricao: string | null
          desconto_anual_percentual: number | null
        }
        Insert: {
          id?: number
          nome: string
          valor?: number | null
          max_funcionarios?: number | null
          descricao?: string | null
          desconto_anual_percentual?: number | null
        }
        Update: {
          id?: number
          nome?: string
          valor?: number | null
          max_funcionarios?: number | null
          descricao?: string | null
          desconto_anual_percentual?: number | null
        }
        Relationships: []
      }
      ponto_funcionarios: {
        Row: {
          data: string | null
          funcionario_id: string | null
          hora_entrada: string | null
          hora_saida: string | null
          id: number
          latitude: number | null
          longitude: number | null
          observacao_entrada: string | null
          observacao_saida: string | null
          status: string | null
        }
        Insert: {
          data?: string | null
          funcionario_id?: string | null
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          observacao_entrada?: string | null
          observacao_saida?: string | null
          status?: string | null
        }
        Update: {
          data?: string | null
          funcionario_id?: string | null
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          observacao_entrada?: string | null
          observacao_saida?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ponto_funcionarios_funcionario_id_fkey"
            columns: ["funcionario_id"]
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          }
        ]
      }
      produtividade: {
        Row: {
          atrasos: number | null
          dias_trabalhados: number | null
          faltas: number | null
          funcionario_id: string | null
          horas_extras: number | null
          id: number
          mes: string | null
        }
        Insert: {
          atrasos?: number | null
          dias_trabalhados?: number | null
          faltas?: number | null
          funcionario_id?: string | null
          horas_extras?: number | null
          id?: number
          mes?: string | null
        }
        Update: {
          atrasos?: number | null
          dias_trabalhados?: number | null
          faltas?: number | null
          funcionario_id?: string | null
          horas_extras?: number | null
          id?: number
          mes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtividade_funcionario_id_fkey"
            columns: ["funcionario_id"]
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          }
        ]
      }
      resumos_diarios: {
        Row: {
          data: string | null
          funcionario_id: string | null
          hora_envio: string | null
          id: number
          link_pdf: string | null
          status_envio: string | null
        }
        Insert: {
          data?: string | null
          funcionario_id?: string | null
          hora_envio?: string | null
          id?: number
          link_pdf?: string | null
          status_envio?: string | null
        }
        Update: {
          data?: string | null
          funcionario_id?: string | null
          hora_envio?: string | null
          id?: number
          link_pdf?: string | null
          status_envio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resumos_diarios_funcionario_id_fkey"
            columns: ["funcionario_id"]
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          }
        ]
      }
      usuarios: {
        Row: {
          id: string
          nome: string | null
          email: string | null
          senha: string | null
          tipo: "admin" | "empresa" | "funcionario" | null
          criado_em: string | null
          cnpj: string | null
          telefone: string | null
        }
        Insert: {
          id: string
          nome?: string | null
          email?: string | null
          senha?: string | null
          tipo?: "admin" | "empresa" | "funcionario" | null
          criado_em?: string | null
          cnpj?: string | null
          telefone?: string | null
        }
        Update: {
          id?: string
          nome?: string | null
          email?: string | null
          senha?: string | null
          tipo?: "admin" | "empresa" | "funcionario" | null
          criado_em?: string | null
          cnpj?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

    