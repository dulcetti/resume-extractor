import { useState, useRef, useCallback } from 'react';
import { extractTextFromPDF } from '@/libs/extract-pdf';

type Session = Awaited<ReturnType<typeof LanguageModel.create>>;

interface ProcessorState {
  status: string;
  result: string;
  isGenerating: boolean;
  error: string | null;
}

export function useResumeProcessor() {
  const [state, setState] = useState<ProcessorState>({
    status: 'Pronto! Selecione um PDF para começar.',
    result: '',
    isGenerating: false,
    error: null,
  });

  const sessionRef = useRef<Session | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const setStatus = (status: string) =>
    setState((previous) => ({ ...previous, status }));

  const process = useCallback(async (file: File, sections: string[]) => {
    if (sections.length === 0) {
      setStatus('⚠️ Selecione ao menos uma seção para extrair.');
      return;
    }

    // Reseta estado e aborta geração anterior se houver
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    sessionRef.current?.destroy();
    sessionRef.current = null;

    setState({
      status: 'Lendo o PDF…',
      result: '',
      isGenerating: true,
      error: null
    });

    try {
      const pdfText = await extractTextFromPDF(file);

      if (pdfText.length < 50) {
        throw new Error(
          'Não foi possível extrair texto do PDF. O arquivo pode ser um PDF escaneado sem camada de texto selecionável.'
        );
      }

      setStatus(`Texto extraído (${pdfText.length} caracteres). Criando sessão…`);

      const session = await LanguageModel.create({
        expectedInputLanguages: ['pt'],
        initialPrompts: [
          {
            role: 'system',
            content:
              'Você é um assistente especializado em leitura de currículos. ' +
              'Analise o texto extraído de um PDF e extraia as informações solicitadas. ' +
              'Formate a resposta usando "## NOME DA SEÇÃO como cabeçalho, ' +
              'com listas quando apropriado. Se uma seção não for encontrada, ' +
              'escreva "Não encontrado no documento." após o cabeçalho.',
          },
        ],
      });

      sessionRef.current = session;
      setStatus('Analisando currículo…');

      const promptText =
        `Aqui está o texto extraído do meu currículo em PDF:\n\n${pdfText}\n\n---\n` +
        `Por favor, extraia e organize as seguintes seções:\n${sections.join(', ')}`;

      const stream = session.promptStreaming(promptText, {
        signal: abortRef.current.signal,
      });

      for await (const chunk of stream) {
        if (abortRef.current.signal.aborted) {
          break;
        }

        setState((previous) => ({ ...previous, result: previous.result + chunk }));
      }

      const aborted = abortRef.current.signal.aborted;
      setState((previous) => ({
        ...previous,
        isGenerating: false,
        status: aborted ? 'Geração interrompida.' : '✅ Análise concluída!',
      }));
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError';

      setState((previous) => ({
        ...previous,
        isGenerating: false,
        status: isAbort ? 'Geração interrompida.' : '❌ Erro ao processar.',
        error: isAbort ? null : (err instanceof Error ? err.message : String(err)),
      }));
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStatus('Interrompendo…');
  }, []);

  return {
    state,
    process,
    stop
  };
}
