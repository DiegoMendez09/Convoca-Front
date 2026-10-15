import type { ProcessResponse } from '../types/process.types';

export interface OfferGuide {
  canApply: boolean;
  reason: string;
  steps: string[];
}

export function buildOfferGuide(process: ProcessResponse): OfferGuide {
  const modality = fold(process.modality);
  const contractType = fold(process.contractType);
  const status = fold(process.status);
  const awarded = fold(process.awarded);
  const supplier = fold(process.supplierName);

  if (modality.includes('contratacion directa')) {
    return closed(
      'La contratación directa no es una convocatoria abierta. No hay una postulación pública en este proceso.',
    );
  }

  if (status !== 'publicado') {
    return closed('Este proceso no está en estado Publicado, así que no admite una oferta nueva.');
  }

  if (awarded === 'si' || (supplier !== '' && supplier !== 'no definido')) {
    return closed('Ya tiene proveedor. No está abierto para presentar otra oferta.');
  }

  if (deadlinePassed(process.offersDueOn)) {
    return closed('El plazo para recibir ofertas ya venció.');
  }

  const due = process.offersDueOn
    ? `La fecha de recepción es ${process.offersDueOn.slice(0, 10)}. Después de esa hora SECOP no recibe la oferta.`
    : 'Confirma en SECOP la fecha y hora de cierre antes de cargar la oferta.';

  const price = process.basePrice
    ? `El precio base es ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(process.basePrice)}. No lo superes y explica el valor si queda muy por debajo: una oferta artificialmente baja se puede rechazar.`
    : 'No superes el presupuesto oficial del proceso y desglosa el precio.';

  return {
    canApply: true,
    reason: '',
    steps: [
      'Entra con el botón de postulación y verifica que tu usuario de proveedor esté activo en SECOP II.',
      'Lee el pliego, los estudios previos y los anexos. Responde cada requisito; un documento faltante inhabilita la oferta.',
      due,
      modalityStep(modality),
      contractStep(contractType),
      price,
      'Carga la oferta en SECOP y conserva el acuse. Si el sistema no confirma el envío, la oferta no quedó presentada.',
    ].filter((step) => step !== ''),
  };
}

function modalityStep(modality: string): string {
  if (modality.includes('minima cuantia')) {
    return 'En mínima cuantía suele ganar la oferta habilitada de menor precio. Adjunta solo la experiencia que pide el aviso.';
  }
  if (modality.includes('licitacion')) {
    return 'Separa la propuesta técnica de la económica. Responde cada factor de evaluación del pliego e incluye la garantía de seriedad si la exige.';
  }
  if (modality.includes('concurso de meritos')) {
    return 'En concurso de méritos pesa la calidad: metodología, equipo y experiencia. El menor precio no define el ganador.';
  }
  if (modality.includes('seleccion abreviada')) {
    return 'Sigue el causal del aviso (menor cuantía, subasta u otro). No uses el formato de otra modalidad.';
  }
  return 'Sigue el documento de condiciones y relaciona la experiencia directamente con el objeto del contrato.';
}

function contractStep(contractType: string): string {
  if (contractType.includes('obra')) {
    return 'En obra incluye programación, personal de obra y el análisis de precios unitarios que pida el pliego.';
  }
  if (contractType.includes('consultoria') || contractType.includes('interventoria')) {
    return 'En consultoría o interventoría presenta hojas de vida del equipo, dedicación y experiencia específica en el objeto.';
  }
  if (contractType.includes('suministro') || contractType.includes('compraventa')) {
    return 'En suministro indica marca, especificaciones, plazo de entrega y garantía de los bienes.';
  }
  return '';
}

function closed(reason: string): OfferGuide {
  return { canApply: false, reason, steps: [] };
}

function deadlinePassed(value: string | null): boolean {
  if (!value) {
    return false;
  }
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) {
    return false;
  }
  const end = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate(), 23, 59, 59);
  return Date.now() > end;
}

function fold(value: string | null | undefined): string {
  return (value ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}
