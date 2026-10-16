import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatCop, formatDate, formatText, statusTone } from '../../../shared/utils/format';
import type { ProcessResponse } from '../types/process.types';
import { buildOfferGuide } from '../utils/offer-guide';

@Component({
  selector: 'app-process-table',
  imports: [RouterLink],
  templateUrl: './process-table.component.html',
})
export class ProcessTableComponent {
  readonly processes = input.required<ProcessResponse[]>();
  readonly pageNumber = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly favoriteIds = input<string[]>([]);
  readonly hasMore = input(false);
  readonly profileText = input('');
  readonly pageChange = output<number>();
  readonly favoriteToggle = output<ProcessResponse>();

  protected readonly formatCop = formatCop;
  protected readonly formatDate = formatDate;
  protected readonly formatText = formatText;
  protected readonly statusTone = statusTone;

  readonly canSubscribe = (process: ProcessResponse): boolean =>
    buildOfferGuide(process, this.profileText()).canApply;

  readonly subscribeLabel = (process: ProcessResponse): string =>
    buildOfferGuide(process, this.profileText()).verdict;

  readonly subscribeReason = (process: ProcessResponse): string =>
    buildOfferGuide(process, this.profileText()).reason;

  protected isFavorite(processId: string): boolean {
    return this.favoriteIds().includes(processId);
  }

  protected previousPage(): void {
    this.pageChange.emit(this.pageNumber() - 1);
  }

  protected nextPage(): void {
    this.pageChange.emit(this.pageNumber() + 1);
  }
}
