import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import type { GenerateExamValues, MeritExam, MeritExamSummary } from '../types/exam.types';

@Injectable({ providedIn: 'root' })
export class ExamsApi {
  private readonly http = inject(HttpClient);

  list(): Observable<MeritExamSummary[]> {
    return this.http.get<MeritExamSummary[]>('/api/v1/exams');
  }

  get(examId: string): Observable<MeritExam> {
    return this.http.get<MeritExam>(`/api/v1/exams/${examId}`);
  }

  generate(values: GenerateExamValues): Observable<MeritExam> {
    return this.http.post<MeritExam>('/api/v1/exams', values);
  }

  remove(examId: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/exams/${examId}`);
  }
}
