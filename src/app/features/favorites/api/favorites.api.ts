import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import type { FavoriteResponse } from '../types/favorite.types';

@Injectable({ providedIn: 'root' })
export class FavoritesApi {
  private readonly http = inject(HttpClient);

  list(): Observable<FavoriteResponse[]> {
    return this.http.get<FavoriteResponse[]>('/api/v1/favorites');
  }

  create(processId: string, notes?: string): Observable<FavoriteResponse> {
    return this.http.post<FavoriteResponse>('/api/v1/favorites', { processId, notes });
  }

  remove(processId: string): Observable<unknown> {
    return this.http.delete(`/api/v1/favorites/${encodeURIComponent(processId)}`);
  }
}
