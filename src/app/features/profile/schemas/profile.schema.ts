import { z } from 'zod';

export const profileSchema = z.object({
  title: z.string().max(200, 'Máximo 200 caracteres'),
  experience: z.string().max(2000, 'Máximo 2000 caracteres'),
  keywords: z.string().max(300, 'Máximo 300 caracteres'),
  useForSearch: z.boolean(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const emptyProfileForm: ProfileFormValues = {
  title: '',
  experience: '',
  keywords: '',
  useForSearch: false,
};

export function profileFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && errors[key] === undefined) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
