import type { ProcessResponse } from '../types/process.types';

export type OfferGuide = {
  canApply: boolean;
  verdict: string;
  reason: string;
  profileNote: string;
  steps: string[];
};

const OBJECT_WORDS = new Set([
  'contratar', 'contrato', 'prestacion', 'servicio', 'servicios', 'software', 'obra',
  'suministro', 'suministros', 'consultoria', 'adquisicion', 'mantenimiento', 'apoyo',
  'diagnostico', 'diseno', 'compra', 'interventoria', 'estudio', 'estudios', 'sistema',
  'sistemas', 'personal', 'profesional', 'profesionales', 'administracion', 'hojas',
  'soporte', 'implementacion', 'desarrollo', 'asesoria', 'medico', 'medicos', 'equipo',
  'equipos', 'adquisicion', 'publicidad', 'arrendamiento', 'construccion', 'mejoramiento',
]);

const STOP_WORDS = new Set([
  'para', 'como', 'este', 'esta', 'esto', 'entre', 'sobre', 'desde', 'hasta', 'donde',
  'cuando', 'con', 'por', 'del', 'las', 'los', 'una', 'uno', 'que', 'sus', 'más', 'mas',
  'años', 'anos', 'experiencia', 'laboral', 'titulo', 'profesional', 'trabajo',
]);

export function buildOfferGuide(process: ProcessResponse, profileText: string | null | undefined): OfferGuide {
  const modality = fold(process.modality);
  const contractType = fold(process.contractType);
  const status = fold(process.status);
  const awarded = fold(process.awarded);
  const supplier = fold(process.supplierName);
  const title = fold(process.procedureName);
  const personName = looksLikePersonName(process.procedureName);

  if (modality.includes('regimen especial') && !modality.includes('con ofertas')) {
    return closed(
      'No deja suscribirte',
      personName
        ? `El título es el nombre de una persona (${process.procedureName}). Es la publicidad de un contrato de régimen especial, no una convocatoria. El portal de contratación no abre suscripción ni creación de oferta.`
        : 'Es contratación de régimen especial sin fase de ofertas. La entidad publica el contrato; no hay postulación abierta.',
      profileFit(process, profileText, false),
    );
  }

  if (modality.includes('contratacion directa') && !modality.includes('con ofertas')) {
    return closed(
      'No deja suscribirte',
      'La contratación directa no es una convocatoria. No hay botón para suscribirte ni para presentar oferta.',
      profileFit(process, profileText, false),
    );
  }

  if (modality.includes('solicitud de informacion')) {
    return closed(
      'No es una oferta',
      'La entidad pide información a proveedores. No es un proceso para presentar oferta.',
      profileFit(process, profileText, false),
    );
  }

  if (isCompanyProcess(modality, contractType)) {
    return closed(
      'Proceso de empresa',
      'Pide firma, capacidad financiera o un equipo. Como persona natural, ingeniero de sistemas y sin empresa, no te sirve.',
      profileFit(process, profileText, false),
    );
  }

  if (personName && !process.offersDueOn) {
    return closed(
      'No deja suscribirte',
      `El título es el nombre de una persona (${process.procedureName}) y no hay fecha de recepción de ofertas. El contrato ya está encaminado a esa persona.`,
      profileFit(process, profileText, false),
    );
  }

  if (status !== 'publicado') {
    return closed(
      'Todavía no recibe ofertas',
      'Este proceso no está en estado Publicado. Mientras siga en borrador u otro estado, no puedes suscribirte para ofertar.',
      profileFit(process, profileText, false),
    );
  }

  if (awarded === 'si' || (supplier !== '' && supplier !== 'no definido')) {
    return closed(
      'Ya tiene proveedor',
      'Ya fue adjudicado. No admite otra oferta.',
      profileFit(process, profileText, false),
    );
  }

  if (!process.offersDueOn) {
    return closed(
      'No deja suscribirte',
      'Está publicado, pero no trae fecha de recepción de ofertas. Sin ese plazo el proceso no está recibiendo propuestas.',
      profileFit(process, profileText, false),
    );
  }

  if (deadlinePassed(process.offersDueOn)) {
    return closed(
      'Plazo vencido',
      `La recepción de ofertas cerró el ${process.offersDueOn.slice(0, 10)}. El portal ya no deja presentar la oferta.`,
      profileFit(process, profileText, false),
    );
  }

  const due = `La recepción de ofertas va hasta el ${process.offersDueOn.slice(0, 10)}. Después de esa fecha el portal no recibe la oferta. Confirma la hora exacta en el cronograma del proceso.`;
  const price = process.basePrice
    ? `El presupuesto oficial es ${formatCop(process.basePrice)}. No lo superes. Si cotizas muy por debajo, explica el valor: una oferta artificialmente baja se puede rechazar.`
    : 'No superes el presupuesto oficial y desglosa el precio como lo pida la lista del cuestionario.';

  return {
    canApply: true,
    verdict: 'Puedes suscribirte',
    reason: 'Puedes presentarte como persona natural. Es mínima cuantía de prestación de servicios: no pide empresa ni un equipo.',
    profileNote: profileFit(process, profileText, true),
    steps: [
      'Preséntate a tu nombre, con cédula, RUT y seguridad social. No ofrezcas una empresa. Si el pliego pide un equipo, alcanza con una o dos personas de apoyo; si pide una firma o varios profesionales, no sigas.',
      'Entra con tu usuario de proveedor, abre el proceso y suscríbete. Suscribirte no es presentar la oferta: después hay que crearla y enviarla.',
      'Descarga la invitación pública, los estudios previos y los anexos. Cada pregunta del cuestionario pide un documento; si falta uno, la oferta queda no habilitada.',
      due,
      modalityStep(modality),
      contractStep(contractType, title),
      price,
      'Carga cada anexo en su pregunta, envía la oferta y conserva el acuse. Si el portal no confirma el envío, la oferta no quedó presentada.',
    ].filter((step) => step !== ''),
  };
}

export function profileCorpus(title?: string | null, experience?: string | null, keywords?: string | null): string {
  return [title, experience, keywords].filter((part) => !!part?.trim()).join(' ');
}

function closed(verdict: string, reason: string, profileNote: string): OfferGuide {
  return {
    canApply: false,
    verdict,
    reason,
    profileNote,
    steps: [],
  };
}

function isCompanyProcess(modality: string, contractType: string): boolean {
  if (
    modality.includes('licitacion') ||
    modality.includes('concurso de meritos') ||
    modality.includes('seleccion abreviada') ||
    modality.includes('subasta') ||
    modality.includes('enajenacion')
  ) {
    return true;
  }

  return (
    contractType.includes('obra') ||
    contractType.includes('consultoria') ||
    contractType.includes('interventoria') ||
    contractType.includes('compraventa') ||
    contractType.includes('suministro') ||
    contractType.includes('arrendamiento')
  );
}

function modalityStep(modality: string): string {
  if (modality.includes('minima cuantia')) {
    return 'En mínima cuantía gana la oferta habilitada de menor precio. La experiencia del pliego es requisito para habilitar, no un puntaje: si los certificados no corresponden al objeto, no compites.';
  }
  if (modality.includes('licitacion')) {
    return 'En licitación separa la propuesta técnica de la económica y responde cada factor de evaluación. Incluye la garantía de seriedad si el pliego la exige.';
  }
  if (modality.includes('concurso de meritos')) {
    return 'En concurso de méritos pesa la calidad: metodología, equipo y experiencia. El menor precio no define el ganador.';
  }
  if (modality.includes('seleccion abreviada') || modality.includes('subasta')) {
    return 'Sigue el causal del aviso. En subasta inversa el precio se puja después de quedar habilitado.';
  }
  if (modality.includes('con ofertas')) {
    return 'Aunque la modalidad es de régimen especial o directa, esta sí tiene fase de ofertas. Sigue el cronograma y el cuestionario; no la trates como un contrato ya asignado.';
  }
  return 'Sigue el documento de condiciones y relaciona la experiencia directamente con el objeto del contrato.';
}

function contractStep(contractType: string, title: string): string {
  if (contractType.includes('obra') || title.includes('obra')) {
    return 'En obra incluye programación, personal y el análisis de precios unitarios que pida el pliego.';
  }
  if (contractType.includes('consultoria') || contractType.includes('interventoria') || title.includes('consultoria')) {
    return 'En consultoría presenta el equipo mínimo, la dedicación y experiencia específica en el objeto. Un perfil general no reemplaza ese requisito.';
  }
  if (contractType.includes('compraventa') || contractType.includes('suministro') || title.includes('software')) {
    return 'En compraventa o software adjunta las especificaciones técnicas firmadas y acredita contratos del mismo objeto, no solo experiencia tecnológica general.';
  }
  return 'Acredita la experiencia con el objeto exacto que pida la invitación, no con un contrato parecido de otro tema.';
}

function profileFit(process: ProcessResponse, profileText: string | null | undefined, canOffer: boolean): string {
  const corpus = fold(profileText);
  if (!corpus) {
    return 'Guarda tu título, experiencia y palabras clave en Mi perfil para ver si este objeto coincide contigo.';
  }

  const processText = fold(`${process.procedureName ?? ''} ${process.description ?? ''} ${process.contractType ?? ''}`);
  const hits = tokens(corpus).filter((token) => processText.includes(token)).slice(0, 4);
  if (hits.length === 0) {
    return canOffer
      ? 'Tu perfil no coincide con este objeto. Presentar oferta sin la experiencia que pide el pliego suele dejar la propuesta no habilitada.'
      : 'Tu perfil tampoco coincide con este objeto.';
  }

  const match = `Tu perfil coincide en: ${hits.join(', ')}.`;
  return canOffer
    ? `${match} Confirma en la invitación que esa experiencia cumple el requisito, no solo que la palabra aparece.`
    : `${match} Aun así, este proceso no recibe tu oferta.`;
}

function looksLikePersonName(value: string | null | undefined): boolean {
  const raw = fold(value);
  if (!raw) {
    return false;
  }

  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 5) {
    return false;
  }

  if (words.some((word) => OBJECT_WORDS.has(word) || /\d/.test(word))) {
    return false;
  }

  return words.every((word) => word.length >= 3 && /^[a-z]+$/.test(word));
}

function tokens(value: string): string[] {
  const unique = new Set<string>();
  for (const word of value.split(/[^a-z0-9]+/)) {
    if (word.length < 4 || STOP_WORDS.has(word)) {
      continue;
    }
    unique.add(word);
  }
  return [...unique];
}

function deadlinePassed(value: string): boolean {
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) {
    return false;
  }
  const end = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate(), 23, 59, 59);
  return Date.now() > end;
}

function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

function fold(value: string | null | undefined): string {
  return (value ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}
