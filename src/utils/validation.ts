import { RequestInput } from '../models/request';

export type FormErrors = Partial<Record<keyof RequestInput, string>>;

export const LIMITS = {
  nameMin: 3,
  nameMax: 60,
  petMin: 2,
  petMax: 30,
  descriptionMax: 300,
} as const;

const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]+$/;

export function normalizePhone(value: string): string {
  return value.replace(/[\s()-]/g, '');
}

export function validateClientName(value: string): string | undefined {
  const v = value.trim();
  if (!v) return 'Ingresa el nombre del cliente.';
  if (v.length < LIMITS.nameMin) return `Usa al menos ${LIMITS.nameMin} caracteres.`;
  if (v.length > LIMITS.nameMax) return `Máximo ${LIMITS.nameMax} caracteres.`;
  if (!NAME_PATTERN.test(v)) return 'El nombre solo puede contener letras y espacios.';
  return undefined;
}

export function validatePhone(value: string): string | undefined {
  const v = normalizePhone(value.trim());
  if (!v) return 'Ingresa un número de teléfono.';
  if (!/^\+?\d+$/.test(v)) return 'El teléfono solo puede contener números.';
  if (/^9\d{8}$/.test(v) || /^\+?\d{7,15}$/.test(v)) return undefined;
  return 'Ingresa un teléfono válido (ej. 987 654 321).';
}

export function validatePetName(value: string): string | undefined {
  const v = value.trim();
  if (!v) return 'Ingresa el nombre de la mascota.';
  if (v.length < LIMITS.petMin) return `Usa al menos ${LIMITS.petMin} caracteres.`;
  if (v.length > LIMITS.petMax) return `Máximo ${LIMITS.petMax} caracteres.`;
  return undefined;
}

export function validateDescription(value: string): string | undefined {
  if (value.trim().length > LIMITS.descriptionMax) {
    return `La descripción admite hasta ${LIMITS.descriptionMax} caracteres.`;
  }
  return undefined;
}

export function validateRequest(input: Partial<RequestInput>): FormErrors {
  const errors: FormErrors = {
    clienteNombre: validateClientName(input.clienteNombre ?? ''),
    telefono: validatePhone(input.telefono ?? ''),
    mascotaNombre: validatePetName(input.mascotaNombre ?? ''),
    tipoServicio: input.tipoServicio ? undefined : 'Selecciona el tipo de servicio.',
    prioridad: input.prioridad ? undefined : 'Selecciona una prioridad.',
    descripcion: validateDescription(input.descripcion ?? ''),
  };
  (Object.keys(errors) as (keyof FormErrors)[]).forEach((key) => {
    if (!errors[key]) delete errors[key];
  });
  return errors;
}

export const hasErrors = (errors: FormErrors) => Object.keys(errors).length > 0;
