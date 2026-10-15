import { ParamMap } from '@angular/router';

import { emptyProcessSearchForm, ProcessSearchFormValues } from '../schemas/process-search.schema';
import type { ProcessSearchQuery } from '../types/process.types';

export function filtersFromParams(params: ParamMap): ProcessSearchQuery {
  const pageNumber = positiveInt(params.get('pageNumber'), 1);
  const pageSize = positiveInt(params.get('pageSize'), 20);
  const minBasePrice = optionalNumber(params.get('minBasePrice'));
  const maxBasePrice = optionalNumber(params.get('maxBasePrice'));

  return {
    keyword: text(params.get('keyword')),
    entityName: text(params.get('entityName')),
    entityNit: text(params.get('entityNit')),
    department: text(params.get('department')),
    city: text(params.get('city')),
    modality: text(params.get('modality')),
    contractType: text(params.get('contractType')),
    status: text(params.get('status')),
    publishedFrom: text(params.get('publishedFrom')),
    publishedTo: text(params.get('publishedTo')),
    minBasePrice,
    maxBasePrice,
    publishedOnly: params.get('publishedOnly') !== 'false',
    openForOffer: params.get('openForOffer') === 'true',
    pageNumber,
    pageSize,
  };
}

export function formFromQuery(query: ProcessSearchQuery): ProcessSearchFormValues {
  return {
    ...emptyProcessSearchForm,
    keyword: query.keyword ?? '',
    entityName: query.entityName ?? '',
    entityNit: query.entityNit ?? '',
    department: query.department ?? '',
    city: query.city ?? '',
    modality: query.modality ?? '',
    contractType: query.contractType ?? '',
    status: query.status ?? '',
    publishedFrom: query.publishedFrom ?? '',
    publishedTo: query.publishedTo ?? '',
    minBasePrice: query.minBasePrice === undefined ? '' : String(query.minBasePrice),
    maxBasePrice: query.maxBasePrice === undefined ? '' : String(query.maxBasePrice),
    publishedOnly: query.publishedOnly,
    openForOffer: query.openForOffer,
  };
}

export function queryFromForm(values: ProcessSearchFormValues, pageNumber = 1): ProcessSearchQuery {
  return {
    keyword: blankToUndefined(values.keyword),
    entityName: blankToUndefined(values.entityName),
    entityNit: blankToUndefined(values.entityNit),
    department: blankToUndefined(values.department),
    city: blankToUndefined(values.city),
    modality: blankToUndefined(values.modality),
    contractType: blankToUndefined(values.contractType),
    status: blankToUndefined(values.status),
    publishedFrom: blankToUndefined(values.publishedFrom),
    publishedTo: blankToUndefined(values.publishedTo),
    minBasePrice: optionalNumber(values.minBasePrice),
    maxBasePrice: optionalNumber(values.maxBasePrice),
    publishedOnly: values.publishedOnly,
    openForOffer: values.openForOffer,
    pageNumber,
    pageSize: 20,
  };
}

export function queryParamsFromQuery(query: ProcessSearchQuery): Record<string, string> {
  const params: Record<string, string> = {
    publishedOnly: String(query.publishedOnly),
    openForOffer: String(query.openForOffer),
    pageNumber: String(query.pageNumber),
    pageSize: String(query.pageSize),
  };

  assign(params, 'keyword', query.keyword);
  assign(params, 'entityName', query.entityName);
  assign(params, 'entityNit', query.entityNit);
  assign(params, 'department', query.department);
  assign(params, 'city', query.city);
  assign(params, 'modality', query.modality);
  assign(params, 'contractType', query.contractType);
  assign(params, 'status', query.status);
  assign(params, 'publishedFrom', query.publishedFrom);
  assign(params, 'publishedTo', query.publishedTo);
  if (query.minBasePrice !== undefined) {
    params['minBasePrice'] = String(query.minBasePrice);
  }
  if (query.maxBasePrice !== undefined) {
    params['maxBasePrice'] = String(query.maxBasePrice);
  }
  return params;
}

function assign(params: Record<string, string>, key: string, value: string | undefined): void {
  if (value) {
    params[key] = value;
  }
}

function text(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function blankToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function optionalNumber(value: string | null): number | undefined {
  if (!value || value.trim() === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function recentPublishedFrom(days = 30): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}
