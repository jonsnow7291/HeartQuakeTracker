export interface GuideMeta {
  id: string;
  title: string;
  summary: string;
  category: 'MOCHILA' | 'ESTRUCTURAL' | 'PLAN_FAMILIAR' | 'PRIMEROS_AUXILIOS' | 'OTRO';
  version: string;
  readMin: number;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  protocolRef?: string;
  guideId?: string;
}

export interface QuizLevel {
  id: string;
  order: number;
  title: string;
  questions: QuizQuestion[];
}

export interface QuizBank {
  levels: QuizLevel[];
}

export interface ContentService {
  listGuides(): Promise<GuideMeta[]>;
  getGuideMarkdown(id: string): Promise<string>; // CONTENT_CORRUPT | CONTENT_MISSING
  checkUpdates(): Promise<{ available: boolean; applied: boolean }>; // en segundo plano
  getQuizBank(): Promise<QuizBank>; // JSON validado contra schema
}
