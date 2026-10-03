/**
 * Configuration of application service modes (MOCK vs REAL).
 * Santiago controls this file during integration points to switch
 * services from mock to real implementations as Juan Diego delivers them.
 */

export type ServiceMode = 'mock' | 'real';

export interface AppModeConfig {
  session: ServiceMode;
  permissions: ServiceMode;
  medical: ServiceMode;
  emergency: ServiceMode;
  mesh: ServiceMode;
  rescuer: ServiceMode;
  sensors: ServiceMode;
  alerts: ServiceMode;
  sync: ServiceMode;
  reports: ServiceMode;
  content: ServiceMode;
  progress: ServiceMode;
  poi: ServiceMode;
  tiles: ServiceMode;
  aid: ServiceMode;
  power: ServiceMode;
}

export const defaultModes: AppModeConfig = {
  // Week 1-2 default: Everything in mock mode
  session: 'mock',
  permissions: 'mock',
  medical: 'mock',
  emergency: 'mock',
  mesh: 'mock',
  rescuer: 'mock',
  sensors: 'mock',
  alerts: 'mock',
  sync: 'mock',
  reports: 'mock',
  content: 'mock',
  progress: 'mock',
  poi: 'mock',
  tiles: 'mock',
  aid: 'mock',
  power: 'mock',
};
