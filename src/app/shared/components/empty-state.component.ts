import { Component } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="state-panel">
      <h2>No hay procesos publicados</h2>
      <p>Ningún proceso coincide con los filtros. Prueba con otra palabra clave, entidad o rango de fechas.</p>
    </div>
  `,
})
export class EmptyStateComponent {}
