import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  template: `
    <div class="state-panel state-panel-error" role="alert">
      <h2>convocaApp no pudo completar la solicitud</h2>
      <p>{{ message() }}</p>
      <button type="button" (click)="retry.emit()">Reintentar</button>
    </div>
  `,
})
export class ErrorStateComponent {
  readonly message = input('convocaApp no pudo completar la solicitud.');
  readonly retry = output<void>();
}
