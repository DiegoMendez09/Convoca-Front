import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { injectMutation, injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { map, lastValueFrom } from 'rxjs';

import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state.component';
import { readErrorMessage } from '../../../shared/utils/read-error-message';
import { FavoritesApi } from '../../favorites/api/favorites.api';
import { ProcessesApi } from '../api/processes.api';
import { ProcessFiltersComponent } from '../components/process-filters.component';
import { ProcessTableComponent } from '../components/process-table.component';
import {
  processSearchSchema,
  ProcessSearchFormValues,
  zodFieldErrors,
} from '../schemas/process-search.schema';
import type { ProcessResponse } from '../types/process.types';
import {
  filtersFromParams,
  formFromQuery,
  queryFromForm,
  queryParamsFromQuery,
  recentPublishedFrom,
} from '../utils/process-query';

@Component({
  selector: 'app-process-search-page',
  imports: [ProcessFiltersComponent, ProcessTableComponent, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  templateUrl: './process-search.page.html',
})
export class ProcessSearchPage {
  private readonly api = inject(ProcessesApi);
  private readonly favoritesApi = inject(FavoritesApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly queryClient = injectQueryClient();

  private readonly paramMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  private readonly mode = toSignal(
    this.route.data.pipe(map((data) => (data['mode'] === 'open' ? 'open' : 'all'))),
    { initialValue: this.route.snapshot.data['mode'] === 'open' ? 'open' : 'all' },
  );

  protected readonly fieldErrors = signal<Record<string, string>>({});
  protected readonly exportNotice = signal('');
  protected readonly favoriteNotice = signal('');
  protected readonly isOpenMode = computed(() => this.mode() === 'open');

  protected readonly submittedFilters = computed(() => {
    const filters = filtersFromParams(this.paramMap());
    if (!this.isOpenMode()) {
      return filters;
    }

    return {
      ...filters,
      status: 'Publicado',
      publishedOnly: true,
      openForOffer: true,
    };
  });

  protected readonly formValues = computed(() => formFromQuery(this.submittedFilters()));

  protected readonly processesQuery = injectQuery(() => ({
    queryKey: ['processes', 'search', this.submittedFilters()],
    enabled: this.paramMap().has('publishedFrom') || this.paramMap().has('publishedTo'),
    queryFn: () => lastValueFrom(this.api.search(this.submittedFilters())),
  }));

  constructor() {
    effect(() => {
      const params = this.paramMap();
      if (params.has('publishedFrom') || params.has('publishedTo')) {
        return;
      }

      void this.router.navigate([], {
        relativeTo: this.route,
        replaceUrl: true,
        queryParamsHandling: 'merge',
        queryParams: {
          publishedFrom: recentPublishedFrom(),
          publishedOnly: params.get('publishedOnly') ?? 'true',
          openForOffer: this.isOpenMode() ? 'true' : (params.get('openForOffer') ?? 'false'),
          pageNumber: params.get('pageNumber') ?? '1',
          pageSize: params.get('pageSize') ?? '20',
        },
      });
    });
  }

  protected readonly favoritesQuery = injectQuery(() => ({
    queryKey: ['favorites'],
    queryFn: () => lastValueFrom(this.favoritesApi.list()),
    retry: false,
  }));

  protected readonly favoriteIds = computed(() =>
    (this.favoritesQuery.data() ?? []).map((favorite) => favorite.processId),
  );

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

  protected readonly favoriteMutation = injectMutation(() => ({
    mutationFn: (process: ProcessResponse) => {
      if (this.favoriteIds().includes(process.processId)) {
        return lastValueFrom(this.favoritesApi.remove(process.processId));
      }
      return lastValueFrom(this.favoritesApi.create(process.processId));
    },
    onSuccess: async () => {
      this.favoriteNotice.set('');
      await this.queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: (error: unknown) => {
      this.favoriteNotice.set(readErrorMessage(error));
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
    if (this.isOpenMode()) {
      query.openForOffer = true;
      query.status = 'Publicado';
      query.publishedOnly = true;
    }

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

  protected toggleFavorite(process: ProcessResponse): void {
    this.favoriteNotice.set('');
    this.favoriteMutation.mutate(process);
  }
}
