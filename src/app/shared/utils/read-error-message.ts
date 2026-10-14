import { HttpErrorResponse } from '@angular/common/http';

export function readErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { message?: string } | null;
    if (body && typeof body.message === 'string' && body.message.trim() !== '') {
      return body.message;
    }
  }
  return 'No fue posible consultar SECOP II. Revisa la conexión e inténtalo de nuevo.';
}
