import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import type { ProfileFormValues } from '../schemas/profile.schema';
import type { ProfileResponse } from '../types/profile.types';

@Injectable({ providedIn: 'root' })
export class ProfileApi {
  private readonly http = inject(HttpClient);

  get(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>('/api/v1/profile');
  }

  save(values: ProfileFormValues): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>('/api/v1/profile', values);
  }
}
