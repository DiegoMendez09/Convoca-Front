export interface ExamQuestion {
  number: number;
  section: string;
  topic: string;
  stem: string;
  options: string[];
  correctIndex: number;
}

export interface MeritExam {
  examId: string | null;
  title: string;
  level: string;
  opecCode: string;
  callNumber: string;
  jobTitle: string;
  saved: boolean;
  notice: string | null;
  createdOn: string | null;
  questions: ExamQuestion[];
}

export interface MeritExamSummary {
  examId: string;
  title: string;
  level: string;
  opecCode: string;
  questionCount: number;
  createdOn: string;
}

export interface FunctionManual {
  manualId: string;
  fileName: string;
  opecCode: string;
  jobTitle: string;
  level: string;
  grade: string;
  purpose: string;
  functions: string;
  knowledge: string;
  uploadedOn: string;
}

export interface GenerateExamValues {
  callNumber: string;
  entityName: string;
  level: string;
  opecCode: string;
  jobTitle: string;
  grade: string;
  purpose: string;
  functions: string;
  knowledge: string;
  axes: string;
  manualId: string | null;
}
