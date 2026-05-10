import {
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { COLOMBIA_TZ } from './constants';

export type Quincena = {
  label: string;
  start: Date;
  end: Date;
  key: string;
};

export function getQuincenas(year: number, month: number): [Quincena, Quincena] {
  const ref = new Date(year, month, 1);
  const monthStart = startOfMonth(ref);
  const monthEnd = endOfMonth(ref);
  const mid1 = new Date(year, month, 15, 23, 59, 59, 999);
  const mid2 = new Date(year, month, 16, 0, 0, 0, 0);

  return [
    {
      label: `1 - 15 ${format(ref, 'MMMM yyyy', { locale: es })}`,
      start: monthStart,
      end: mid1,
      key: `${year}-${String(month + 1).padStart(2, '0')}-Q1`,
    },
    {
      label: `16 - ${format(monthEnd, 'd')} ${format(ref, 'MMMM yyyy', {
        locale: es,
      })}`,
      start: mid2,
      end: monthEnd,
      key: `${year}-${String(month + 1).padStart(2, '0')}-Q2`,
    },
  ];
}

export function getCurrentQuincena(): Quincena {
  const now = new Date();
  const [q1, q2] = getQuincenas(now.getFullYear(), now.getMonth());
  return now.getDate() <= 15 ? q1 : q2;
}

export function getLastNQuincenas(n: number): Quincena[] {
  const result: Quincena[] = [];
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let startWithSecondHalf = now.getDate() > 15;

  while (result.length < n) {
    const [q1, q2] = getQuincenas(year, month);
    if (startWithSecondHalf) {
      result.push(q2);
      if (result.length < n) result.push(q1);
      startWithSecondHalf = false;
    } else {
      result.push(q2);
      if (result.length < n) result.push(q1);
    }
    month--;
    if (month < 0) {
      month = 11;
      year--;
    }
  }
  return result.slice(0, n);
}

export function isInQuincena(dateStr: string, q: Quincena): boolean {
  return isWithinInterval(parseISO(dateStr), { start: q.start, end: q.end });
}

export function formatFechaShort(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM', { locale: es });
}

export function formatFechaFull(dateStr: string): string {
  return format(parseISO(dateStr), "EEEE d 'de' MMMM, yyyy", { locale: es });
}

export function formatFechaDDMMYYYY(dateStr: string): string {
  return format(parseISO(dateStr), 'dd/MM/yyyy');
}

/** "yyyy-MM-dd" para HOY en zona horaria de Colombia (America/Bogota) */
export function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: COLOMBIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** "HH:MM" para AHORA en zona horaria de Colombia */
export function nowHHMMColombia(): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: COLOMBIA_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
  return parts; // "HH:MM"
}

/** 0 = Domingo, 1 = Lunes, ..., 6 = Sábado — en Colombia */
export function dayOfWeekColombia(): number {
  const [y, m, d] = todayISO().split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCDay();
}

export function computeTotalHoras(horaInicio: string, horaFinal: string): number {
  if (!horaInicio || !horaFinal) return 0;
  const [h1, m1] = horaInicio.split(':').map(Number);
  const [h2, m2] = horaFinal.split(':').map(Number);
  let minutes = h2 * 60 + m2 - (h1 * 60 + m1);
  if (minutes < 0) minutes += 24 * 60; // overnight shift
  return Math.round((minutes / 60) * 100) / 100;
}

export function formatHoras(horas: number): string {
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
