export interface FavoriteResponse {
  favoriteId: string;
  processId: string;
  procedureName: string;
  entityName: string;
  status: string | null;
  modality: string | null;
  basePrice: number | null;
  publishedOn: string | null;
  notes: string | null;
  createdOn: string;
}
