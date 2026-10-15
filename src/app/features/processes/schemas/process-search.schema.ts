import { z } from 'zod';

export const processSearchSchema = z
  .object({
    keyword: z.string().max(200, 'Máximo 200 caracteres'),
    entityName: z.string().max(200, 'Máximo 200 caracteres'),
    entityNit: z.string().max(200, 'Máximo 200 caracteres'),
    department: z.string().max(200, 'Máximo 200 caracteres'),
    city: z.string().max(200, 'Máximo 200 caracteres'),
    modality: z.string().max(200, 'Máximo 200 caracteres'),
    contractType: z.string().max(200, 'Máximo 200 caracteres'),
    status: z.string().max(200, 'Máximo 200 caracteres'),
    publishedFrom: z.string(),
    publishedTo: z.string(),
    minBasePrice: z.string(),
    maxBasePrice: z.string(),
    publishedOnly: z.boolean(),
    openForOffer: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.publishedFrom && value.publishedTo && value.publishedFrom > value.publishedTo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La fecha inicial debe ser anterior o igual a la final',
        path: ['publishedTo'],
      });
    }

    const minPrice = parsePrice(value.minBasePrice);
    const maxPrice = parsePrice(value.maxBasePrice);

    if (value.minBasePrice.trim() !== '' && minPrice === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El precio mínimo no es válido',
        path: ['minBasePrice'],
      });
    }

    if (value.maxBasePrice.trim() !== '' && maxPrice === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El precio máximo no es válido',
        path: ['maxBasePrice'],
      });
    }

    if (minPrice !== null && minPrice < 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El precio no puede ser negativo',
        path: ['minBasePrice'],
      });
    }

    if (maxPrice !== null && maxPrice < 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El precio no puede ser negativo',
        path: ['maxBasePrice'],
      });
    }

    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El precio mínimo debe ser menor o igual al máximo',
        path: ['maxBasePrice'],
      });
    }
  });

export type ProcessSearchFormValues = z.infer<typeof processSearchSchema>;

export const emptyProcessSearchForm: ProcessSearchFormValues = {
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
  openForOffer: false,
};

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && errors[key] === undefined) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

function parsePrice(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}
