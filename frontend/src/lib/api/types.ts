/**
 * Generic Spring Data page response shape.
 * Matches what Spring Data serializes when returning Page<T>.
 */
export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  empty: boolean;
}

/**
 * Standard error response from the backend's GlobalExceptionHandler.
 * Every error in the API follows this shape.
 */
export interface ApiError {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  path: string;
  errors?: Array<{ field: string; message: string }>;
}
