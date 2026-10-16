import { profileSchema, type ProfileFormValues } from './schemas/profile.schema';

export interface ProfileTemplate {
  titulo: string;
  experiencia: string;
  palabrasClave: string;
  usarEnBusqueda: boolean;
}

export const blankProfileTemplate: ProfileTemplate = {
  titulo: '',
  experiencia: '',
  palabrasClave: '',
  usarEnBusqueda: false,
};

export function toProfileTemplate(values: ProfileFormValues): ProfileTemplate {
  return {
    titulo: values.title,
    experiencia: values.experience,
    palabrasClave: values.keywords,
    usarEnBusqueda: values.useForSearch,
  };
}

export function parseProfileTemplate(raw: string): ProfileFormValues {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('El archivo no es una plantilla válida.');
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('La plantilla no tiene el formato esperado.');
  }

  const record = data as Record<string, unknown>;
  const parsed = profileSchema.safeParse({
    title: readText(record, 'titulo', 'title'),
    experience: readText(record, 'experiencia', 'experience'),
    keywords: readText(record, 'palabrasClave', 'keywords'),
    useForSearch: readFlag(record, 'usarEnBusqueda', 'useForSearch'),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'La plantilla supera el tamaño permitido.');
  }

  return parsed.data;
}

export function downloadProfileTemplate(template: ProfileTemplate, fileName: string): void {
  const blob = new Blob([`${JSON.stringify(template, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function readText(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') {
      return value;
    }
  }
  return '';
}

function readFlag(record: Record<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }
  return false;
}
