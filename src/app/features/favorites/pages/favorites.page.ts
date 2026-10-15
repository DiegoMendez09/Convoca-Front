import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { injectMutation, injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state.component';
import { formatCop, formatDate, formatText, statusTone } from '../../../shared/utils/format';
import { readErrorMessage } from '../../../shared/utils/read-error-message';
import { FavoritesApi } from '../api/favorites.api';
import type { FavoriteResponse } from '../types/favorite.types';

@Component({
  selector: 'app-favorites-page',
  imports: [RouterLink, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  templateUrl: './favorites.page.html',
})
export class FavoritesPage {
  private readonly api = inject(FavoritesApi);
  private readonly queryClient = injectQueryClient();

  protected readonly formatCop = formatCop;
  protected readonly formatDate = formatDate;
  protected readonly formatText = formatText;
  protected readonly statusTone = statusTone;
  protected readonly notice = signal('');

  protected readonly favoritesQuery = injectQuery(() => ({
    queryKey: ['favorites'],
    queryFn: () => lastValueFrom(this.api.list()),
    retry: false,
  }));

  protected readonly removeMutation = injectMutation(() => ({
    mutationFn: (favorite: FavoriteResponse) => lastValueFrom(this.api.remove(favorite.processId)),
    onSuccess: async () => {
      this.notice.set('Se quitó de favoritos.');
      await this.queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: (error: unknown) => this.notice.set(readErrorMessage(error)),
  }));

  protected readonly errorMessage = computed(() => readErrorMessage(this.favoritesQuery.error()));
  protected readonly favorites = computed(() => this.favoritesQuery.data() ?? []);

  protected remove(favorite: FavoriteResponse): void {
    this.notice.set('');
    this.removeMutation.mutate(favorite);
  }
}
