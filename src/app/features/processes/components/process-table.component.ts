import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatCop, formatDate, formatText } from '../../../shared/utils/format';
import type { ProcessResponse } from '../types/process.types';

@Component({
  selector: 'app-process-table',
  imports: [RouterLink],
  templateUrl: './process-table.component.html',
})
export class ProcessTableComponent {
  readonly processes = input.required<ProcessResponse[]>();
  readonly pageNumber = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();

  protected readonly formatCop = formatCop;
  protected readonly formatDate = formatDate;
  protected readonly formatText = formatText;

  protected previousPage(): void {
    this.pageChange.emit(this.pageNumber() - 1);
  }

  protected nextPage(): void {
    this.pageChange.emit(this.pageNumber() + 1);
  }
}
