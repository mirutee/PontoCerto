'use server';

import {
  type SuggestTimeOffJustificationInput,
  type SuggestTimeOffJustificationOutput,
} from '@/ai/flows/suggest-time-off-justification';
import { z } from 'zod';

const ActionInputSchema = z.object({
  employeeName: z.string(),
  timeOffType: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  additionalDetails: z.string().optional(),
});

export async function suggestJustificationAction(
  input: z.infer<typeof ActionInputSchema>
): Promise<SuggestTimeOffJustificationOutput> {
  const { suggestTimeOffJustification } = await import('@/ai/flows/suggest-time-off-justification');

  const availableReasons = [
    'Férias',
    'Licença Médica',
    'Folga Pessoal',
    'Emergência Familiar',
    'Consulta Médica',
    'Luto',
  ];

  const validatedInput = ActionInputSchema.parse(input);

  const flowInput: SuggestTimeOffJustificationInput = {
    ...validatedInput,
    availableReasons,
  };

  try {
    const result = await suggestTimeOffJustification(flowInput);
    return result;
  } catch (error) {
    console.error('Erro ao chamar o fluxo suggestTimeOffJustification:', error);
    return { justificationSuggestions: [] };
  }
}
