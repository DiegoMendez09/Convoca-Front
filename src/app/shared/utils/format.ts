const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

export function formatCop(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'Sin dato';
  }
  return currencyFormatter.format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return 'Sin dato';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Sin dato';
  }
  return dateFormatter.format(date);
}

export function formatText(value: string | null | undefined): string {
  if (!value || value.trim() === '') {
    return 'Sin dato';
  }
  return value;
}
