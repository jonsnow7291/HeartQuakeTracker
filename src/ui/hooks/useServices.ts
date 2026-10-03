import React, { createContext, useContext, ReactNode } from 'react';
import { Services } from '../../contracts/container';

const ServicesContext = createContext<Services | null>(null);

export interface ServicesProviderProps {
  services: Services;
  children: ReactNode;
}

export function ServicesProvider({ services, children }: ServicesProviderProps) {
  return React.createElement(ServicesContext.Provider, { value: services }, children);
}

/**
 * Access all domain services defined in contracts.
 * Always resolves to either mock or real service instances configured in DI container.
 */
export function useServices(): Services {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
}
