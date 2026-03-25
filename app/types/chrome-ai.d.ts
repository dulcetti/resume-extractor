// A API do Chrome não tem tipos oficiais ainda, declaramos o mínimo necessário
declare global {
  const LanguageModel: {
    availability: (opts: { languages: string[] }) => Promise<string>;
    create: (opts: {
      expectedInputLanguages: string[];
      initialPrompts: { role: string; content: string }[];
    }) => Promise<{
      promptStreaming: (
        prompt: string,
        opts?: { signal?: AbortSignal },
      ) => AsyncIterable<string>;
      destroy: () => void;
    }>;
  };
}

export {};
