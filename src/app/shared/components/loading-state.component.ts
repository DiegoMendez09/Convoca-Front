import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  template: `
    <div class="state-panel" role="status" data-testid="loading-state">
      <span class="spinner" aria-hidden="true"></span>
      <p>Cargando…</p>
    </div>
  `,
})
export class LoadingStateComponent {}
