'use client';

import { ResumeExtractor } from '@/components/resume-extractor';
import styles from '@/styles/Grid.module.scss';

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>🗒️ Resume Converter</h1>

      <ResumeExtractor />

      <footer className={styles.footer}>
        <address>
          Bruno Dulcetti — Pós em Engenharia de Software com IA Aplicada — UNIPDS — <span id="year">{ year }</span>
        </address>
      </footer>
    </div>
  );
}
