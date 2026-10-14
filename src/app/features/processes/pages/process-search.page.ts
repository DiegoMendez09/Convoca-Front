import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state.component';
import { readErrorMessage } from '../../../shared/utils/read-error-message';
import { ProcessesApi } from '../api/processes.api';
import { ProcessFiltersComponent } from '../components/process-filters.component';
import { ProcessTableComponent } from '../components/process-table.component';
import {
  processSearchSchema,
  ProcessSearchFormValues,
  zodFieldErrors,
} from '../schemas/process-search.schema';
import {
  filtersFromParams,
  formFromQuery,
  queryFromForm,
  queryParamsFromQuery,
} from '../utils/process-query';

@Component({
  selector: 'app-process-search-page',
  imports: [ProcessFiltersComponent, ProcessTableComponent, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  templateUrl: './process-search.page.html',
})
export class ProcessSearchPage {
  private readonly api = inject(ProcessesApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly paramMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly fieldErrors = signal<Record<string, string>>({});
  protected readonly exportNotice = signal('');

  protected readonly submittedFilters = computed(() => filtersFromParams(this.paramMap()));
  protected readonly formValues = computed(() => formFromQuery(this.submittedFilters()));

  protected readonly processesQuery = injectQuery(() => ({
    queryKey: ['processes', 'search', this.submittedFilters()],
    queryFn: () => lastValueFrom(this.api.search(this.submittedFilters())),
  }));

  protected readonly exportMutation = injectMutation(() => ({
    mutationFn: () => lastValueFrom(this.api.export(this.submittedFilters())),
    onSuccess: (response) => {
      const blob = response.body;
      if (!blob) {
        this.exportNotice.set('La exportación no devolvió un archivo.');
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'procesos-secop-ii.csv';
      link.click();
      URL.revokeObjectURL(url);

      const truncated = response.headers.get('X-Export-Truncated') === 'true';
      this.exportNotice.set(
        truncated
          ? 'Se exportaron los primeros 500 procesos. Ajusta los filtros para un archivo más preciso.'
          : 'Archivo CSV descargado.',
      );
    },
    onError: (error: unknown) => {
      this.exportNotice.set(readErrorMessage(error));
    },
  }));

  protected readonly errorMessage = computed(() => readErrorMessage(this.processesQuery.error()));
  protected readonly totalRecords = computed(() => this.processesQuery.data()?.totalRecords ?? 0);

  protected search(values: ProcessSearchFormValues): void {
    const parsed = processSearchSchema.safeParse(values);
    if (!parsed.success) {
      this.fieldErrors.set(zodFieldErrors(parsed.error));
      return;
    }

    this.fieldErrors.set({});
    this.exportNotice.set('');
    const query = queryFromForm(parsed.data, 1);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParamsFromQuery(query),
    });
  }

  protected changePage(pageNumber: number): void {
    const query = { ...this.submittedFilters(), pageNumber };
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParamsFromQuery(query),
    });
  }

  protected exportResults(): void {
    this.exportNotice.set('');
    this.exportMutation.mutate(undefined);
  }
}
