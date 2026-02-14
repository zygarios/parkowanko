export function extractFirstError(error: any): string {
  if (!error) return 'Wystąpił nieoczekiwany błąd';
  if (typeof error === 'string') return error;

  // Uzyskaj obiekt błędów (może być bezpośrednio w error lub w error.errors)
  const errorsObj = error.errors || error;

  if (typeof errorsObj === 'object' && errorsObj !== null) {
    const values = Object.values(errorsObj);
    for (const val of values) {
      if (typeof val === 'string') return val;
      if (Array.isArray(val) && typeof val[0] === 'string') return val[0];
    }
  }

  return 'Błąd podczas przetwarzania żądania';
}
