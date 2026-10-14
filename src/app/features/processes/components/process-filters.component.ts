import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { emptyProcessSearchForm, ProcessSearchFormValues } from '../schemas/process-search.schema';

@Component({
  selector: 'app-process-filters',
  imports: [ReactiveFormsModule],
  templateUrl: './process-filters.component.html',
})
export class ProcessFiltersComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly values = input<ProcessSearchFormValues>(emptyProcessSearchForm);
  readonly fieldErrors = input<Record<string, string>>({});
  readonly search = output<ProcessSearchFormValues>();

  protected readonly form = this.formBuilder.nonNullable.group({
    keyword: '',
    entityName: '',
    entityNit: '',
    department: '',
    city: '',
    modality: '',
    contractType: '',
    status: '',
    publishedFrom: '',
    publishedTo: '',
    minBasePrice: '',
    maxBasePrice: '',
    publishedOnly: true,
  });

  protected readonly modalities = [
    'Licitación pública',
    'Selección abreviada',
    'Concurso de méritos',
    'Mínima cuantía',
    'Contratación directa',
    'Contratación régimen especial',
  ];

  protected readonly contractTypes = [
    'Prestación de servicios',
    'Suministro',
    'Obra',
    'Compraventa',
    'Consultoría',
    'Interventoría',
  ];

  protected readonly statuses = ['Publicado', 'Aprobado', 'Evaluación', 'Adjudicado', 'Desierto'];

  constructor() {
    effect(() => {
      this.form.patchValue(this.values(), { emitEvent: false });
    });
  }

  protected submitSearch(): void {
    this.search.emit(this.form.getRawValue());
  }

  protected describedBy(name: string): string | null {
    return this.fieldErrors()[name] ? `${name}-error` : null;
  }
}
