export interface ProfileResponse {
  title: string;
  experience: string;
  keywords: string;
  useForSearch: boolean;
  searchText: string | null;
  updatedOn: string | null;
}
