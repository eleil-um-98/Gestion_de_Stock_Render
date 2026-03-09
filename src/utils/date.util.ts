export function toLocalDate(date: Date): string {
    return new Intl.DateTimeFormat('es-PE', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).format(date);
}

export function getStartOfDayLima(dateString: string): Date {
    return new Date(`${dateString}T00:00:00-05:00`);
}

export function getEndOfDayLima(dateString: string): Date {
    return new Date(`${dateString}T23:59:59.999-05:00`);
}