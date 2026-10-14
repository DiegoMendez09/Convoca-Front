import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  template: `
    <div class="state-panel state-panel-error" role="alert">
      <h2>No se pudo completar la consulta</h2>
      <p>{{ message() }}</p>
      <button type="button" (click)="retry.emit()">Reintentar</button>
    </div>
  `,
})
export class ErrorStateComponent {
  readonly message = input('No fue posible consultar SECOP II.');
  readonly retry = output<void>();
}
