/**
 * Normaliza um CPF para o formato XXX.XXX.XXX-XX.
 * Se o valor não possuir 11 dígitos após remover caracteres não numéricos,
 * retorna o valor original para que a validação correspondente trate o erro.
 */
export function normalizeCpf(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${digits.substring(9, 11)}`;
  }
  return value;
}

/**
 * Normaliza um número de telefone brasileiro para o formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX.
 * Se o valor não possuir 10 ou 11 dígitos após remover caracteres não numéricos,
 * retorna o valor original para que a validação correspondente trate o erro.
 */
export function normalizePhone(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7, 11)}`;
  }
  if (digits.length === 10) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6, 10)}`;
  }
  return value;
}
