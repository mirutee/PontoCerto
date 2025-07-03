import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check, Fingerprint } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/models';

type Plan = Database['public']['Tables']['planos']['Row'];

const formatPrice = (plan: Plan) => {
  if (!plan.valor) {
    return <div className="text-4xl font-bold">Contato</div>;
  }

  if (plan.descricao === 'Anual' && plan.desconto_anual_percentual && plan.desconto_anual_percentual > 0) {
    const monthlyPrice = plan.valor;
    const totalYearly = monthlyPrice * 12;
    const discountAmount = totalYearly * (plan.desconto_anual_percentual / 100);
    const finalPrice = totalYearly - discountAmount;
    
    return (
      <div>
        <div className="text-4xl font-bold">
          R${finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-lg font-normal text-muted-foreground">/ano</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Economia de R${discountAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Equivale a R${(finalPrice / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês)
        </p>
      </div>
    );
  }

  // Monthly plan or Annual without discount
  return (
    <div className="text-4xl font-bold">
      R${plan.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      <span className="text-lg font-normal text-muted-foreground">/mês</span>
    </div>
  );
};

// Placeholder features as they are not in the DB
const getPlanFeatures = (planName: string | null) => {
  const features: { [key: string]: string[] } = {
    'Equipe Pequena': [
      'Até 10 funcionários',
      'Registro de ponto',
      'Gestão de ausências'
    ],
     'Básico': [
      'Até 10 funcionários',
      'Registro de ponto',
      'Gestão de ausências'
    ],
    'Equipe Média': [
      'Até 30 funcionários',
      'Tudo do plano anterior',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
    'Profissional': [
      'Até 30 funcionários',
      'Tudo do plano anterior',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
    'Personalizado': [
      'Funcionários ilimitados',
      'Tudo do plano anterior',
      'Integrações e SLA',
      'Gerente de conta dedicado'
    ],
     'Empresarial': [
      'Funcionários ilimitados',
      'Tudo do plano anterior',
      'Integrações e SLA',
      'Gerente de conta dedicado'
    ]
  };

  const defaultFeatures = [
    'Registro de ponto',
    'Gestão de ausências',
    'Relatórios Completos'
  ];
  
  return features[planName || ''] || defaultFeatures;
}

export default async function LandingPage() {
  
  const { data: plans, error } = await supabase
    .from('planos')
    .select('*')
    .order('valor', { ascending: true, nullsFirst: false });
  
  if (error) {
    console.error("Error fetching plans:", error);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Fingerprint className="h-8 w-8 text-primary" />
          <span className="ml-2 text-xl font-bold">PontoCerto</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button variant="ghost" asChild>
            <Link href="/login" prefetch={false}>
              Entrar
            </Link>
          </Button>
          <Button asChild>
            <Link href="/signup" prefetch={false}>Cadastrar</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-muted/40">
          <div className="container px-4 md:px-6 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Otimize a Gestão de Ponto da Sua Equipe
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                PontoCerto é a solução completa para registro de ponto, gestão de ausências e relatórios. Simplifique seus processos de RH e foque no que realmente importa.
              </p>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Recursos Principais</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Tudo que você precisa em um só lugar</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Nossa plataforma oferece ferramentas poderosas para gerenciar a jornada de trabalho da sua equipe com eficiência e transparência.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:grid-cols-3 lg:gap-12 mt-12">
              <div className="grid gap-1 text-center">
                <h3 className="text-lg font-bold">Registro de Ponto Inteligente</h3>
                <p className="text-sm text-muted-foreground">
                  Bata o ponto com um clique, com geolocalização, e acompanhe horas trabalhadas em tempo real.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <h3 className="text-lg font-bold">Gestão de Ausências</h3>
                <p className="text-sm text-muted-foreground">
                  Solicite e aprove folgas, férias e licenças de forma centralizada, com justificativas via IA.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <h3 className="text-lg font-bold">Relatórios Completos</h3>
                <p className="text-sm text-muted-foreground">
                  Gere relatórios detalhados de folha de ponto, ausências e horas extras para tomada de decisões.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Planos flexíveis para todos os tamanhos de equipe
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Escolha o plano que melhor se adapta às necessidades da sua empresa.
              </p>
            </div>
            <div className="mx-auto w-full grid max-w-sm gap-8 lg:max-w-none lg:grid-cols-3 mt-8">
               {plans && plans.length > 0 ? (
                plans.map((plan) => (
                   <Card key={plan.id}>
                    <CardHeader>
                      <CardTitle>{plan.nome}</CardTitle>
                      <CardDescription>
                          {`Ideal para equipes com até ${plan.max_funcionarios === 0 || !plan.max_funcionarios ? 'ilimitados' : plan.max_funcionarios} funcionários.`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {formatPrice(plan)}
                       <ul className="grid gap-2 text-sm text-left">
                        {getPlanFeatures(plan.nome).map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                {feature}
                            </li>
                        ))}
                        </ul>
                      <Button variant={!plan.valor ? 'outline' : 'default'} asChild>
                        <Link href={!plan.valor ? '#' : '/signup'}>{!plan.valor ? 'Entre em Contato' : 'Escolher Plano'}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="col-span-3 text-muted-foreground">Não foi possível carregar os planos. Tente novamente mais tarde.</p>
              )}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 PontoCerto. Todos os direitos reservados.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Termos de Serviço
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Política de Privacidade
          </Link>
        </nav>
      </footer>
    </div>
  );
}
