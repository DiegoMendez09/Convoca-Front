import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { injectMutation, injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

import { ErrorStateComponent } from '../../../shared/components/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state.component';
import { readErrorMessage } from '../../../shared/utils/read-error-message';
import { ExamsApi } from '../api/exams.api';
import type { MeritExam } from '../types/exam.types';

@Component({
  selector: 'app-exams-page',
  imports: [ReactiveFormsModule, LoadingStateComponent, ErrorStateComponent],
  templateUrl: './exams.page.html',
})
export class ExamsPage {
  private readonly api = inject(ExamsApi);
  private readonly formBuilder = inject(FormBuilder);
  private readonly queryClient = injectQueryClient();

  protected readonly notice = signal('');
  protected readonly noticeIsError = signal(false);
  protected readonly exam = signal<MeritExam | null>(null);
  protected readonly answers = signal<Record<number, number>>({});
  protected readonly graded = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    callNumber: '',
    entityName: '',
    level: 'Profesional',
    opecCode: '',
    jobTitle: '',
    grade: '',
    purpose: '',
    functions: '',
    knowledge: '',
    axes: '',
  });

  protected readonly examsQuery = injectQuery(() => ({
    queryKey: ['exams'],
    queryFn: () => lastValueFrom(this.api.list()),
    retry: false,
  }));

  protected readonly generateMutation = injectMutation(() => ({
    mutationFn: () => lastValueFrom(this.api.generate(this.form.getRawValue())),
    onSuccess: (created) => {
      this.exam.set(created);
      this.answers.set({});
      this.graded.set(false);
      this.noticeIsError.set(false);
      this.notice.set(created.saved ? 'Examen generado y guardado.' : (created.notice ?? 'Examen generado.'));
      void this.queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
    onError: (error: unknown) => {
      this.noticeIsError.set(true);
      this.notice.set(readErrorMessage(error));
    },
  }));

  protected readonly openMutation = injectMutation(() => ({
    mutationFn: (examId: string) => lastValueFrom(this.api.get(examId)),
    onSuccess: (opened) => {
      this.exam.set(opened);
      this.answers.set({});
      this.graded.set(false);
      this.notice.set('');
    },
    onError: (error: unknown) => {
      this.noticeIsError.set(true);
      this.notice.set(readErrorMessage(error));
    },
  }));

  protected readonly deleteMutation = injectMutation(() => ({
    mutationFn: (examId: string) => lastValueFrom(this.api.remove(examId)),
    onSuccess: (_result, examId) => {
      if (this.exam()?.examId === examId) {
        this.exam.set(null);
      }
      void this.queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  }));

  protected generate(): void {
    this.notice.set('');
    this.generateMutation.mutate();
  }

  protected choose(number: number, option: number): void {
    if (this.graded()) {
      return;
    }
    this.answers.update((current) => ({ ...current, [number]: option }));
  }

  protected grade(): void {
    this.graded.set(true);
  }

  protected score(): { correct: number; total: number } {
    const current = this.exam();
    if (!current) {
      return { correct: 0, total: 0 };
    }
    const selected = this.answers();
    const correct = current.questions.filter((question) => selected[question.number] === question.correctIndex).length;
    return { correct, total: current.questions.length };
  }

}
