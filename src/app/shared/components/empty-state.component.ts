import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="state-panel">
      <h2>{{ title() }}</h2>
      <p>{{ message() }}</p>
    </div>
  `,
})
export class EmptyStateComponent {
  readonly title = input('No hay procesos publicados');
  readonly message = input('Ningún proceso coincide con los filtros. Prueba con otra palabra clave, entidad o rango de fechas.');
}
