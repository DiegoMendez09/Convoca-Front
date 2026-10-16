import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { injectMutation, injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

import { ErrorStateComponent } from '../../../shared/components/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state.component';
import { readErrorMessage } from '../../../shared/utils/read-error-message';
import { ProfileApi } from '../api/profile.api';
import {
  blankProfileTemplate,
  downloadProfileTemplate,
  parseProfileTemplate,
  toProfileTemplate,
} from '../profile-template';
import { emptyProfileForm, profileFieldErrors, profileSchema } from '../schemas/profile.schema';

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule, LoadingStateComponent, ErrorStateComponent],
  templateUrl: './profile.page.html',
})
export class ProfilePage {
  private readonly api = inject(ProfileApi);
  private readonly formBuilder = inject(FormBuilder);
  private readonly queryClient = injectQueryClient();

  protected readonly fieldErrors = signal<Record<string, string>>({});
  protected readonly notice = signal('');
  protected readonly noticeIsError = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    title: '',
    experience: '',
    keywords: '',
    useForSearch: false,
  });

  protected readonly profileQuery = injectQuery(() => ({
    queryKey: ['profile'],
    queryFn: () => lastValueFrom(this.api.get()),
    retry: false,
  }));

  protected readonly saveMutation = injectMutation(() => ({
    mutationFn: () => lastValueFrom(this.api.save(this.form.getRawValue())),
    onSuccess: async (profile) => {
      this.form.markAsPristine();
      this.noticeIsError.set(false);
      this.notice.set(
        profile.useForSearch && profile.searchText
          ? `Plantilla guardada. Las búsquedas usan: ${profile.searchText}.`
          : 'Plantilla guardada. La búsqueda sigue siendo la general.',
      );
      await this.queryClient.invalidateQueries({ queryKey: ['profile'] });
      await this.queryClient.invalidateQueries({ queryKey: ['processes'] });
    },
    onError: (error: unknown) => {
      this.noticeIsError.set(true);
      this.notice.set(readErrorMessage(error));
    },
  }));

  constructor() {
    effect(() => {
      const profile = this.profileQuery.data();
      if (!profile || this.form.dirty) {
        return;
      }

      this.form.patchValue({
        title: profile.title ?? '',
        experience: profile.experience ?? '',
        keywords: profile.keywords ?? '',
        useForSearch: profile.useForSearch,
      });
    });
  }

  protected downloadBlank(): void {
    downloadProfileTemplate(blankProfileTemplate, 'plantilla-perfil.json');
  }

  protected downloadFilled(): void {
    const values = { ...emptyProfileForm, ...this.form.getRawValue() };
    downloadProfileTemplate(toProfileTemplate(values), 'perfil-convoca.json');
  }

  protected async upload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    try {
      const values = parseProfileTemplate(await file.text());
      this.form.patchValue(values);
      this.form.markAsDirty();
      this.fieldErrors.set({});
      this.noticeIsError.set(false);
      this.notice.set('');
      this.saveMutation.mutate(undefined);
    } catch (error: unknown) {
      this.noticeIsError.set(true);
      this.notice.set(error instanceof Error ? error.message : 'No se pudo leer la plantilla.');
    }
  }

  protected save(): void {
    const parsed = profileSchema.safeParse({ ...emptyProfileForm, ...this.form.getRawValue() });
    if (!parsed.success) {
      this.fieldErrors.set(profileFieldErrors(parsed.error));
      this.notice.set('');
      return;
    }

    this.fieldErrors.set({});
    this.notice.set('');
    this.noticeIsError.set(false);
    this.saveMutation.mutate(undefined);
  }

  protected describedBy(name: string): string | null {
    return this.fieldErrors()[name] ? `${name}-error` : null;
  }

  protected readonly errorMessage = () => readErrorMessage(this.profileQuery.error());
}
