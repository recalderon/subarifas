/**
 * Converts a date to Brazilian timezone (America/Sao_Paulo)
 */
export const toBrazilianTime = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

/**
 * Checks if a raffle has ended based on Brazilian timezone
 */
export const hasRaffleEnded = (endDate: Date): boolean => {
  const now = new Date();
  return now >= endDate;
};

/**
 * Formats a date for display in Brazilian format
 */
export const formatBrazilianDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};
