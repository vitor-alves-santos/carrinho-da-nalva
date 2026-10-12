/**
 * Utilitários de fuso horário do cardápio.
 *
 * Todo corte de data do backend (inclusive o "hoje" e os limites de exclusão de
 * histórico) é calculado em America/Sao_Paulo. Manter a lógica em um único lugar
 * evita que o limite da exclusão discrepe do corte de "hoje" e acabe apagando
 * parte do dia corrente.
 *
 * Convenção do projeto: 00:00 em Brasília = 03:00 UTC (UTC-3, sem horário de verão).
 */

export const TIMEZONE = "America/Sao_Paulo";

type CamposData = {
  year: string;
  month: string;
  day: string;
};

function dataLocalAgora(): CamposData {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const campo = (type: "year" | "month" | "day") =>
    parts.find((p) => p.type === type)?.value ?? "";

  return { year: campo("year"), month: campo("month"), day: campo("day") };
}

/**
 * Instante em que começa o dia de hoje em America/Sao_Paulo.
 */
export function startOfToday(): Date {
  const { year, month, day } = dataLocalAgora();
  return new Date(`${year}-${month}-${day}T03:00:00Z`);
}

/**
 * Instante em que começa o primeiro dia do mês indicado, em America/Sao_Paulo.
 * @param mes mês no formato "MM" (01–12).
 */
export function startOfMonth(ano: string, mes: string): Date {
  return new Date(`${ano}-${mes}-01T03:00:00Z`);
}

/**
 * Mês atual em America/Sao_Paulo, no formato "YYYY-MM".
 */
export function currentMonth(): string {
  const { year, month } = dataLocalAgora();
  return `${year}-${month}`;
}

/**
 * Mês de uma data, em America/Sao_Paulo, no formato "YYYY-MM".
 * Usado para derivar a faixa de meses disponível para exclusão.
 */
export function monthOf(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).format(date);
}

/**
 * Índice linear de um mês "YYYY-MM". Útil para comparações e janelas
 * (ex.: "3 meses atrás"), evitando aritmética de data com fuso.
 */
export function monthIndex(month: string): number {
  const [ano, mes] = month.split("-");
  return Number(ano) * 12 + (Number(mes) - 1);
}

/**
 * "2026-07" → "julho de 2026" (rótulo em português).
 */
export function formatMonthLabel(month: string): string {
  const [ano, mes] = month.split("-");
  const date = new Date(Date.UTC(Number(ano), Number(mes) - 1, 1));
  const nome = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    timeZone: "UTC",
  }).format(date);

  return `${nome} de ${ano}`;
}
