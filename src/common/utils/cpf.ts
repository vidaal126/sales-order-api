/**
 * Valida um CPF conferindo os dígitos verificadores (não apenas o formato).
 * Aceita o valor com ou sem máscara — caracteres não numéricos são removidos.
 * Rejeita sequências de dígitos repetidos (ex.: 000.000.000-00, 111.111.111-11),
 * que passam no cálculo mas nunca são CPFs válidos.
 */
export function isValidCpf(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  const cpf = value.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calcCheckDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(cpf[i]) * (length + 1 - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  if (calcCheckDigit(9) !== Number(cpf[9])) return false;
  if (calcCheckDigit(10) !== Number(cpf[10])) return false;

  return true;
}
