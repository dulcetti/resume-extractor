"use client";

import { useState } from "react";
import { useResumeProcessor } from "@/hooks/use-resume-processor";
import styles from '@/styles/ResumeConverter.module.scss';

const SECTIONS = [
  "Experiência Profissional",
  "Contatos",
  "Educação",
  "Habilidades",
  "Idiomas",
  "Publicações",
];

export function ResumeConverter() {
  const { state, process, stop } = useResumeProcessor();
  const [file, setFile] = useState<File | null>(null);
  const [sections, setSections] = useState<Record<string, boolean>>(
    Object.fromEntries(SECTIONS.map((s) => [s, true]))
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
  }

  function handleSectionChange(section: string, checked: boolean) {
    setSections((prev) => ({ ...prev, [section]: checked }));
  }

  function handleSubmit() {
    if (state.isGenerating) {
      stop();
      return;
    }
    if (!file) return;
    const selected = SECTIONS.filter((s) => sections[s]);
    process(file, selected);
  }

  async function handleCopy() {
    if (!state.result) return;
    await navigator.clipboard.writeText(state.result);
  }

  return (
    <>
      <div className={styles.field}>
        <label>Seu currículo em PDF:</label>
        <input
          type="file"
          accept="application/pdf"
          disabled={state.isGenerating}
          onChange={handleFileChange}
        />
        
        <span className={styles.hint}>Selecione um arquivo .pdf do seu computador</span>
      </div>

      <div className={styles.field}>
        <label>Seções para extrair:</label>
        <div className={styles["sections-grid"]}>
          {SECTIONS.map((section) => (
            <label className={styles["section-toggle"]} key={section}>
              <input
                type="checkbox"
                value={section}
                checked={sections[section]}
                onChange={(e) => handleSectionChange(section, e.target.checked)}
              />
              {section}
            </label>
          ))}
        </div>
      </div>

      <div className={styles["button-group"]}>
        <button
          onClick={handleSubmit}
          className={styles["process-btn"]}
          disabled={!file && !state.isGenerating}
        >
          {state.isGenerating ? "⏹ Parar" : "Processar currículo"}
        </button>
        <p className={styles.status}>{state.status}</p>
      </div>


      {state.error && <p className={styles["error-box"]}>{state.error}</p>}

      <div className={styles["result-area"]}>
        <label className={styles["result-label"]}>Resultado:</label>
        <div className={styles["result-box"]}>{state.result || "O resultado aparecerá aqui..."}</div>
        <button onClick={handleCopy} disabled={!state.result} className={styles["copy-btn"]}>
          Copiar resultado
        </button>
      </div>

    </>
  );
}
