'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { suggestJustificationAction } from '@/app/actions/suggest-justification';
import { createAbsenceRequestAction } from '@/app/actions/absence-actions';
import { useToast } from '@/hooks/use-toast';
import { ptBR } from 'date-fns/locale';
import type { Database } from '@/lib/supabase/models';

type AbsenceRequest = Database['public']['Tables']['faltas_programadas']['Row'];

const formSchema = z.object({
  timeOffType: z.string({ required_error: 'Por favor, selecione um motivo.' }),
  dateRange: z.object(
    {
      from: z.date({ required_error: 'A data de início é obrigatória.' }),
      to: z.date().optional(),
    },
    { required_error: 'Por favor, selecione o período.' }
  ),
  justification: z
    .string()
    .min(10, { message: 'A justificativa deve ter pelo menos 10 caracteres.' }),
  attachment: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AbsenceRequestForm({ onNewRequest }: { onNewRequest: (request: AbsenceRequest) => void }) {
  const [isAiPending, startAiTransition] = useTransition();
  const [isSubmitPending, startSubmitTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      justification: '',
    },
  });
  
  const onSubmit: SubmitHandler<FormValues> = (values) => {
    startSubmitTransition(async () => {
        const formData = new FormData();
        formData.append('timeOffType', values.timeOffType);
        formData.append('startDate', values.dateRange.from.toISOString());
        if (values.dateRange.to) {
            formData.append('endDate', values.dateRange.to.toISOString());
        }
        formData.append('justification', values.justification);
        if (values.attachment) {
            formData.append('attachment', values.attachment);
        }

        const result = await createAbsenceRequestAction(formData);

        if (result.success) {
            toast({
                title: 'Solicitação Enviada',
                description: result.message,
            });
            form.reset();
            setSuggestions([]);
            // This is a way to update the parent component's list without a full refresh
            // But since the action returns void, we can't pass the new request.
            // A full page reload or re-fetch in the parent is an alternative.
            // For now, we assume the parent will re-fetch.
            window.location.reload(); // Simple solution for now
        } else {
            toast({
                variant: 'destructive',
                title: 'Erro ao Enviar',
                description: result.message,
            });
        }
    });
  };

  const handleSuggestJustification = () => {
    const values = form.getValues();
    if (!values.timeOffType || !values.dateRange?.from) {
      toast({
        variant: 'destructive',
        title: 'Informação Faltando',
        description: 'Por favor, selecione um tipo de folga e um período primeiro.',
      });
      return;
    }

    startAiTransition(async () => {
      const result = await suggestJustificationAction({
        employeeName: 'Funcionário', // Mock data
        timeOffType: values.timeOffType,
        startDate: format(values.dateRange.from, 'yyyy-MM-dd'),
        endDate: values.dateRange.to
          ? format(values.dateRange.to, 'yyyy-MM-dd')
          : format(values.dateRange.from, 'yyyy-MM-dd'),
        additionalDetails: values.justification,
      });

      if (result && result.justificationSuggestions) {
        setSuggestions(result.justificationSuggestions.filter(s => s));
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro da IA',
          description: 'Não foi possível gerar sugestões. Verifique se a chave da API está configurada.',
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitar Folga</CardTitle>
        <CardDescription>
          Preencha o formulário para solicitar uma ausência planejada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="timeOffType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um motivo para a ausência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Férias">Férias</SelectItem>
                      <SelectItem value="Licença Médica">Licença Médica</SelectItem>
                      <SelectItem value="Folga Pessoal">Folga Pessoal</SelectItem>
                      <SelectItem value="Emergência Familiar">
                        Emergência Familiar
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Período</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          disabled={isSubmitPending}
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value?.from && 'text-muted-foreground'
                          )}
                        >
                          {field.value?.from ? (
                            field.value.to ? (
                              <>
                                {format(field.value.from, 'dd/MM/y', { locale: ptBR })} -{' '}
                                {format(field.value.to, 'dd/MM/y', { locale: ptBR })}
                              </>
                            ) : (
                              format(field.value.from, 'dd/MM/y', { locale: ptBR })
                            )
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        locale={ptBR}
                        mode="range"
                        selected={field.value}
                        onSelect={field.onChange}
                        numberOfMonths={2}
                        disabled={isSubmitPending}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="justification"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Justificativa</FormLabel>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleSuggestJustification}
                      disabled={isAiPending || isSubmitPending}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {isAiPending ? 'Gerando...' : 'Sugestão da IA'}
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Explique o motivo da sua ausência..."
                      disabled={isSubmitPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  {suggestions.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs text-muted-foreground">Clique para usar uma sugestão:</p>
                      {suggestions.map((s, i) => (
                        <div
                          key={i}
                          className="text-sm p-3 bg-muted rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground"
                          onClick={() => form.setValue('justification', s, { shouldValidate: true })}
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="attachment"
                render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>Anexar Documento (Opcional)</FormLabel>
                  <FormControl>
                    <Input 
                        type="file" 
                        disabled={isSubmitPending}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            onChange(file);
                        }}
                        {...rest}
                     />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitPending}>
              {isSubmitPending ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
