import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { map, lastValueFrom } from 'rxjs';

import { ErrorStateComponent } from '../../../shared/components/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state.component';
import { formatCop, formatDate, formatText, statusTone } from '../../../shared/utils/format';
import { readErrorMessage } from '../../../shared/utils/read-error-message';
import { ProfileApi } from '../../profile/api/profile.api';
import { ProcessesApi } from '../api/processes.api';
import type { ProcessResponse } from '../types/process.types';
import { buildOfferGuide, profileCorpus, type OfferGuide } from '../utils/offer-guide';

@Component({
  selector: 'app-process-detail-page',
  imports: [RouterLink, LoadingStateComponent, ErrorStateComponent],
  templateUrl: './process-detail.page.html',
})
export class ProcessDetailPage {
  private readonly api = inject(ProcessesApi);
  private readonly profileApi = inject(ProfileApi);
  private readonly route = inject(ActivatedRoute);

  private readonly processId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('processId') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('processId') ?? '' },
  );

  protected readonly formatCop = formatCop;
  protected readonly formatDate = formatDate;
  protected readonly formatText = formatText;
  protected readonly statusTone = statusTone;
  readonly offerGuide = (process: ProcessResponse): OfferGuide => buildOfferGuide(process, this.profileText());

  protected readonly profileQuery = injectQuery(() => ({
    queryKey: ['profile'],
    retry: false,
    queryFn: () => lastValueFrom(this.profileApi.get()),
  }));

  protected readonly profileText = computed(() => {
    const profile = this.profileQuery.data();
    if (!profile) {
      return '';
    }
    return profileCorpus(profile.title, profile.experience, profile.keywords);
  });

  protected readonly processQuery = injectQuery(() => ({
    queryKey: ['processes', 'detail', this.processId()],
    enabled: this.processId().length > 0,
    queryFn: () => lastValueFrom(this.api.getById(this.processId())),
  }));

  protected readonly errorMessage = computed(() => readErrorMessage(this.processQuery.error()));
}
