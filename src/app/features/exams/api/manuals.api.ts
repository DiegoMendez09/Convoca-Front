import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import type { FunctionManual } from '../types/exam.types';

@Injectable({ providedIn: 'root' })
export class ManualsApi {
  private readonly http = inject(HttpClient);

  list(): Observable<FunctionManual[]> {
    return this.http.get<FunctionManual[]>('/api/v1/manuals');
  }

  upload(file: File, opecCode: string): Observable<FunctionManual> {
    const data = new FormData();
    data.append('file', file);
    data.append('opecCode', opecCode);
    return this.http.post<FunctionManual>('/api/v1/manuals', data);
  }

  remove(manualId: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/manuals/${manualId}`);
  }
}
