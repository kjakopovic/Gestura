export interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
