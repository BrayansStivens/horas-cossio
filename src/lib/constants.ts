export const USER_INFO = {
  nombre: 'EUCADIO DE JESÚS COSSIO BRAND',
  cedula: '8039507',
  cedulaFormatted: '8.039.507',
  conductorDefault: 'EUCADIO DE JESÚS COSSIO BRAND',
  empresa: 'TRANSPORTES TERRESTRES TORO CANO S.A.S.',
  empresaCorta: '3TC',
  formato: 'F-TH-16',
  version: '01',
} as const;

/** Valores precargados para cada entrada nueva (manual y automática) */
export const DEFAULTS = {
  horaInicio: '06:00',
  horaFinal: '19:00',
  placa: 'WCP 677',
  manifiesto: '',
} as const;

export const COLOMBIA_TZ = 'America/Bogota';

export const SYNTHETIC_EMAIL = `cc${USER_INFO.cedula}@horas3tc.local`;
