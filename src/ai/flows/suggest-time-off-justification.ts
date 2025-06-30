'use server';

/**
 * @fileOverview Sugestões de justificativas para solicitações de folga, com tecnologia de IA.
 *
 * - suggestTimeOffJustification - Uma função que sugere justificativas para pedidos de folga.
 * - SuggestTimeOffJustificationInput - O tipo de entrada para a função suggestTimeOffJustification.
 * - SuggestTimeOffJustificationOutput - O tipo de retorno para a função suggestTimeOffJustification.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTimeOffJustificationInputSchema = z.object({
  employeeName: z.string().describe('O nome do funcionário que está solicitando a folga.'),
  timeOffType: z.string().describe('O tipo de folga sendo solicitada (ex: férias, licença médica, folga pessoal).'),
  startDate: z.string().describe('A data de início da solicitação de folga (AAAA-MM-DD).'),
  endDate: z.string().describe('A data de fim da solicitação de folga (AAAA-MM-DD).'),
  availableReasons: z.array(z.string()).describe('Uma lista de motivos de folga disponíveis e pré-aprovados.'),
  additionalDetails: z.string().optional().describe('Quaisquer detalhes ou contexto adicionais que o funcionário queira fornecer.'),
});
export type SuggestTimeOffJustificationInput = z.infer<typeof SuggestTimeOffJustificationInputSchema>;

const SuggestTimeOffJustificationOutputSchema = z.object({
  justificationSuggestions: z.array(z.string()).describe('Um array de sugestões de justificativas geradas por IA para a solicitação de folga.'),
});
export type SuggestTimeOffJustificationOutput = z.infer<typeof SuggestTimeOffJustificationOutputSchema>;

export async function suggestTimeOffJustification(input: SuggestTimeOffJustificationInput): Promise<SuggestTimeOffJustificationOutput> {
  return suggestTimeOffJustificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTimeOffJustificationPrompt',
  input: {schema: SuggestTimeOffJustificationInputSchema},
  output: {schema: SuggestTimeOffJustificationOutputSchema},
  prompt: `Você é um assistente de IA que ajuda funcionários a escreverem justificativas para suas solicitações de folga.

  Com base nas informações a seguir, gere três sugestões de justificativas diferentes que o funcionário pode usar para sua solicitação de folga. As sugestões devem ser concisas, profissionais e apropriadas para envio ao empregador. Certifique-se de incorporar os motivos disponíveis e usar apenas os motivos disponíveis.

  Nome do Funcionário: {{{employeeName}}}
  Tipo de Folga: {{{timeOffType}}}
  Data de Início: {{{startDate}}}
  Data de Fim: {{{endDate}}}
  Motivos Disponíveis: {{#each availableReasons}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  Detalhes Adicionais: {{{additionalDetails}}}

  Sugestões de Justificativa:
  1.`, // A numeração é importante.
});

const suggestTimeOffJustificationFlow = ai.defineFlow(
  {
    name: 'suggestTimeOffJustificationFlow',
    inputSchema: SuggestTimeOffJustificationInputSchema,
    outputSchema: SuggestTimeOffJustificationOutputSchema,
  },
  async input => {
    const response = await prompt(input);
    // Post-process the response to split the suggestions into an array.
    const rawSuggestions = response.output?.justificationSuggestions;
    if (!rawSuggestions) {
      return {justificationSuggestions: ['']};
    }

    const cleanedSuggestions = rawSuggestions.map(suggestion =>
      suggestion.replace(/^\d+\.\s*/, '').trim() // Remove numbering and whitespace
    );

    return {justificationSuggestions: cleanedSuggestions};
  }
);
