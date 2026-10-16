import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { injectMutation, injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

import { ErrorStateComponent } from '../../../shared/components/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state.component';
import { readErrorMessage } from '../../../shared/utils/read-error-message';
import { ExamsApi } from '../api/exams.api';
import { ManualsApi } from '../api/manuals.api';
import type { MeritExam } from '../types/exam.types';

@Component({
  selector: 'app-exams-page',
  imports: [ReactiveFormsModule, LoadingStateComponent, ErrorStateComponent],
  templateUrl: './exams.page.html',
})
export class ExamsPage {
  private readonly api = inject(ExamsApi);
  private readonly manualsApi = inject(ManualsApi);
  private readonly formBuilder = inject(FormBuilder);
  private readonly queryClient = injectQueryClient();
  private manualFile: File | null = null;

  protected readonly notice = signal('');
  protected readonly noticeIsError = signal(false);
  protected readonly exam = signal<MeritExam | null>(null);
  protected readonly answers = signal<Record<number, number>>({});
  protected readonly graded = signal(false);
  protected readonly fileLabel = signal('Ningún PDF seleccionado');
  protected readonly manualId = signal('');

  protected readonly uploadForm = this.formBuilder.nonNullable.group({
    opecCode: '',
  });

  protected readonly form = this.formBuilder.nonNullable.group({
    callNumber: '',
    entityName: '',
    level: 'Profesional',
    axes: '',
    manualId: '',
  });

  protected readonly examsQuery = injectQuery(() => ({
    queryKey: ['exams'],
    queryFn: () => lastValueFrom(this.api.list()),
    retry: false,
  }));

  protected readonly manualsQuery = injectQuery(() => ({
    queryKey: ['manuals'],
    queryFn: () => lastValueFrom(this.manualsApi.list()),
    retry: false,
  }));

  protected readonly selectedManual = computed(() =>
    this.manualsQuery.data()?.find((item) => item.manualId === this.manualId()) ?? null);

  protected readonly uploadMutation = injectMutation(() => ({
    mutationFn: () => {
      const file = this.manualFile;
      if (!file) {
        throw new Error('Selecciona el PDF del manual.');
      }
      return lastValueFrom(this.manualsApi.upload(file, this.uploadForm.controls.opecCode.value));
    },
    onSuccess: (manual) => {
      this.manualFile = null;
      this.fileLabel.set('Ningún PDF seleccionado');
      this.uploadForm.reset();
      this.form.controls.manualId.setValue(manual.manualId);
      this.manualId.set(manual.manualId);
      if (manual.level) {
        this.form.controls.level.setValue(manual.level);
      }
      this.noticeIsError.set(false);
      this.notice.set(`OPEC ${manual.opecCode} guardada desde ${manual.fileName}.`);
      void this.queryClient.invalidateQueries({ queryKey: ['manuals'] });
    },
    onError: (error: unknown) => {
      this.noticeIsError.set(true);
      this.notice.set(readErrorMessage(error));
    },
  }));

  protected readonly deleteManualMutation = injectMutation(() => ({
    mutationFn: (manualId: string) => lastValueFrom(this.manualsApi.remove(manualId)),
    onSuccess: (_result, manualId) => {
      if (this.manualId() === manualId) {
        this.form.controls.manualId.setValue('');
        this.manualId.set('');
      }
      this.noticeIsError.set(false);
      this.notice.set('Manual eliminado.');
      void this.queryClient.invalidateQueries({ queryKey: ['manuals'] });
    },
    onError: (error: unknown) => {
      this.noticeIsError.set(true);
      this.notice.set(readErrorMessage(error));
    },
  }));

  protected readonly generateMutation = injectMutation(() => ({
    mutationFn: () => {
      const values = this.form.getRawValue();
      return lastValueFrom(this.api.generate({
        callNumber: values.callNumber,
        entityName: values.entityName,
        level: values.level,
        axes: values.axes,
        manualId: values.manualId || null,
        opecCode: '',
        jobTitle: '',
        grade: '',
        purpose: '',
        functions: '',
        knowledge: '',
      }));
    },
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

  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.manualFile = input.files?.[0] ?? null;
    this.fileLabel.set(this.manualFile?.name ?? 'Ningún PDF seleccionado');
  }

  protected upload(input: HTMLInputElement): void {
    if (!this.manualFile) {
      this.noticeIsError.set(true);
      this.notice.set('Selecciona el PDF del manual.');
      return;
    }
    if (this.uploadForm.controls.opecCode.value.trim().length < 3) {
      this.noticeIsError.set(true);
      this.notice.set('Escribe el código de la OPEC que quieres extraer.');
      return;
    }
    this.notice.set('');
    this.uploadMutation.mutate(undefined, {
      onSuccess: () => {
        input.value = '';
      },
    });
  }

  protected useManual(manualId: string): void {
    this.form.controls.manualId.setValue(manualId);
    this.manualId.set(manualId);
    const manual = this.manualsQuery.data()?.find((item) => item.manualId === manualId);
    if (manual?.level) {
      this.form.controls.level.setValue(manual.level);
    }
  }

  protected generate(): void {
    if (!this.form.controls.manualId.value) {
      this.noticeIsError.set(true);
      this.notice.set('Elige la OPEC guardada del manual.');
      return;
    }
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
