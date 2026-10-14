import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import type { PaginationResponse, ProcessResponse, ProcessSearchQuery } from '../types/process.types';

@Injectable({ providedIn: 'root' })
export class ProcessesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/processes';

  search(query: ProcessSearchQuery): Observable<PaginationResponse<ProcessResponse>> {
    return this.http.get<PaginationResponse<ProcessResponse>>(this.baseUrl, {
      params: this.toParams(query),
    });
  }

  getById(processId: string): Observable<ProcessResponse> {
    return this.http.get<ProcessResponse>(`${this.baseUrl}/${encodeURIComponent(processId)}`);
  }

  export(query: ProcessSearchQuery): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/export`, {
      params: this.toParams(query),
      observe: 'response',
      responseType: 'blob',
    });
  }

  private toParams(query: ProcessSearchQuery): HttpParams {
    const entries: Record<string, string | number | boolean | undefined> = {
      keyword: query.keyword,
      entityName: query.entityName,
      entityNit: query.entityNit,
      department: query.department,
      city: query.city,
      modality: query.modality,
      contractType: query.contractType,
      status: query.status,
      publishedFrom: query.publishedFrom,
      publishedTo: query.publishedTo,
      minBasePrice: query.minBasePrice,
      maxBasePrice: query.maxBasePrice,
      publishedOnly: query.publishedOnly,
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
    };

    let params = new HttpParams();
    for (const [key, value] of Object.entries(entries)) {
      if (value === undefined || value === '') {
        continue;
      }
      params = params.set(key, String(value));
    }
    return params;
  }
}
