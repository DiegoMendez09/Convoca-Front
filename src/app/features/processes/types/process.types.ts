export interface ProcessResponse {
  processId: string;
  reference: string | null;
  entityName: string;
  entityNit: string | null;
  department: string | null;
  city: string | null;
  procedureName: string;
  description: string | null;
  phase: string | null;
  publishedOn: string | null;
  lastPublishedOn: string | null;
  offersDueOn: string | null;
  basePrice: number | null;
  modality: string | null;
  duration: number | null;
  durationUnit: string | null;
  status: string | null;
  awarded: string | null;
  awardedOn: string | null;
  awardAmount: number | null;
  supplierName: string | null;
  supplierNit: string | null;
  unspscCode: string | null;
  openingStatus: string | null;
  contractType: string | null;
  processUrl: string | null;
}

export interface PaginationResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasMore: boolean;
  profileKeyword?: string | null;
}

export interface ProcessSearchQuery {
  keyword?: string;
  entityName?: string;
  entityNit?: string;
  department?: string;
  city?: string;
  modality?: string;
  contractType?: string;
  status?: string;
  publishedFrom?: string;
  publishedTo?: string;
  minBasePrice?: number;
  maxBasePrice?: number;
  publishedOnly: boolean;
  openForOffer: boolean;
  pageNumber: number;
  pageSize: number;
}
