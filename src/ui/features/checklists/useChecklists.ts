import { create } from 'zustand';
import type { KeyValueStore } from '../../../core/platform/ports';

export interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface ChecklistsState {
  kitItems: ChecklistItem[];
  familyPlanItems: ChecklistItem[];
  toggleKitItem: (id: string) => void;
  toggleFamilyPlanItem: (id: string) => void;
  resetKit: () => void;
  resetFamilyPlan: () => void;
  resetAllChecklists: () => void;
  getKitProgress: () => { completed: number; total: number; percentage: number };
  getFamilyPlanProgress: () => { completed: number; total: number; percentage: number };
}

const DEFAULT_KIT_ITEMS: ChecklistItem[] = [
  // Agua y Alimentación
  {
    id: 'kit_agua',
    category: 'Agua y Alimentos',
    title: 'Agua potable embotellada',
    description: 'Mínimo 4 litros por persona para 72 horas (beber e higiene básica).',
    completed: false,
  },
  {
    id: 'kit_alimentos',
    category: 'Agua y Alimentos',
    title: 'Alimentos no perecederos',
    description: 'Enlatados con abre fácil, frutos secos, barras de cereal y panela.',
    completed: false,
  },
  {
    id: 'kit_abrelatas',
    category: 'Agua y Alimentos',
    title: 'Abrelatas manual y cubiertos',
    description: 'Herramientas básicas de preparación de comida sin electricidad.',
    completed: false,
  },
  // Comunicación e Iluminación
  {
    id: 'kit_silbato',
    category: 'Comunicación e Iluminación',
    title: 'Silbato de alta frecuencia',
    description: 'Imprescindible para señalización en caso de atrapamiento sin gastar voz.',
    completed: false,
  },
  {
    id: 'kit_linterna',
    category: 'Comunicación e Iluminación',
    title: 'Linterna con baterías de repuesto',
    description: 'Linterna LED a pilas o recargable a dinamo.',
    completed: false,
  },
  {
    id: 'kit_radio',
    category: 'Comunicación e Iluminación',
    title: 'Radio portátil AM/FM a baterías',
    description: 'Para escuchar reportes oficiales de UNGRD e IDIGER en colapso de red.',
    completed: false,
  },
  {
    id: 'kit_powerbank',
    category: 'Comunicación e Iluminación',
    title: 'Batería externa (Powerbank)',
    description: 'Cargada al 100% con cables compatibles para tu teléfono.',
    completed: false,
  },
  // Primeros Auxilios y Salud
  {
    id: 'kit_botiquin',
    category: 'Primeros Auxilios',
    title: 'Botiquín de primeros auxilios',
    description: 'Gasas, vendas elásticas, microporo, alcohol antiséptico y tijeras.',
    completed: false,
  },
  {
    id: 'kit_medicamentos',
    category: 'Primeros Auxilios',
    title: 'Medicamentos personales esenciales',
    description: 'Dosis para mínimo 7 días de tratamientos de uso continuo.',
    completed: false,
  },
  {
    id: 'kit_mascarillas',
    category: 'Primeros Auxilios',
    title: 'Mascarillas de alta eficiencia (N95)',
    description: 'Protección contra inhalación de polvo y partículas de escombros.',
    completed: false,
  },
  // Documentos y Valores
  {
    id: 'kit_documentos',
    category: 'Documentos y Valores',
    title: 'Copias de documentos protegidas',
    description: 'Cédulas, escrituras y pólizas en bolsa hermética impermeable.',
    completed: false,
  },
  {
    id: 'kit_dinero',
    category: 'Documentos y Valores',
    title: 'Dinero en efectivo en baja denominación',
    description: 'Billetes pequeños y monedas para compras si caen los datáfonos.',
    completed: false,
  },
  {
    id: 'kit_llaves',
    category: 'Documentos y Valores',
    title: 'Llaves de repuesto',
    description: 'Copia de llaves de vivienda y vehículo guardadas en la mochila.',
    completed: false,
  },
  // Ropa y Abrigo
  {
    id: 'kit_manta',
    category: 'Ropa y Abrigo',
    title: 'Manta térmica de emergencia',
    description: 'Manta isotérmica espacial aluminizada contra hipotermia.',
    completed: false,
  },
  {
    id: 'kit_ropa',
    category: 'Ropa y Abrigo',
    title: 'Ropa de abrigo y calzado resistente',
    description: 'Chaqueta abrigada, guantes de trabajo y botas o tenis firmes.',
    completed: false,
  },
];

const DEFAULT_FAMILY_PLAN_ITEMS: ChecklistItem[] = [
  // Puntos de encuentro
  {
    id: 'plan_encuentro_casa',
    category: 'Puntos de Encuentro',
    title: 'Punto de encuentro interior seguro',
    description: 'Lugar de menor riesgo dentro de la vivienda (lejos de ventanas y repisas).',
    completed: false,
  },
  {
    id: 'plan_encuentro_barrio',
    category: 'Puntos de Encuentro',
    title: 'Punto de encuentro en el barrio',
    description: 'Parque o plaza amplia despejada de postes eléctricos y fachadas altas.',
    completed: false,
  },
  {
    id: 'plan_encuentro_ciudad',
    category: 'Puntos de Encuentro',
    title: 'Punto de encuentro fuera del sector',
    description: 'Lugar acordado si la zona residencial queda acordonada o inaccesible.',
    completed: false,
  },
  // Comunicación
  {
    id: 'plan_contacto_externo',
    category: 'Contacto de Emergencia',
    title: 'Contacto de enlace fuera de la ciudad',
    description: 'Familiar en otra región que servirá de puente telefónico familiar.',
    completed: false,
  },
  // Roles en el hogar
  {
    id: 'plan_rol_servicios',
    category: 'Asignación de Roles',
    title: 'Responsable de corte de gas y electricidad',
    description: 'Persona encargada de cerrar la llave de paso de gas y bajar los breakers.',
    completed: false,
  },
  {
    id: 'plan_rol_mochila',
    category: 'Asignación de Roles',
    title: 'Responsable de portar la mochila 72h',
    description: 'Persona designada para tomar la mochila y botiquín al evacuar.',
    completed: false,
  },
  {
    id: 'plan_rol_vulnerables',
    category: 'Asignación de Roles',
    title: 'Acompañamiento a niños y adultos mayores',
    description: 'Apoyo prioritario para miembros del hogar con movilidad reducida.',
    completed: false,
  },
  {
    id: 'plan_rol_mascotas',
    category: 'Asignación de Roles',
    title: 'Protección y evacuación de mascotas',
    description: 'Correas, guacal y provisiones mínimas de alimento listas para animales.',
    completed: false,
  },
  // Evacuación y simulacros
  {
    id: 'plan_rutas_despejadas',
    category: 'Evacuación y Simulacros',
    title: 'Rutas de salida identificadas y libres',
    description: 'Pasillos y puertas sin macetas, muebles ni cajas que obstaculicen el paso.',
    completed: false,
  },
  {
    id: 'plan_llaves_visibles',
    category: 'Evacuación y Simulacros',
    title: 'Llaves de salida en lugar fijo y visible',
    description: 'Cerca de la puerta de salida para evacuación rápida incluso a oscuras.',
    completed: false,
  },
  {
    id: 'plan_simulacro',
    category: 'Evacuación y Simulacros',
    title: 'Simulacro familiar practicado',
    description: 'Ensayo de evacuación realizado con toda la familia en los últimos 6 meses.',
    completed: false,
  },
];

export const useChecklists = create<ChecklistsState>((set, get) => ({
  kitItems: DEFAULT_KIT_ITEMS,
  familyPlanItems: DEFAULT_FAMILY_PLAN_ITEMS,

  toggleKitItem: (id: string) => {
    set((state) => ({
      kitItems: state.kitItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  },

  toggleFamilyPlanItem: (id: string) => {
    set((state) => ({
      familyPlanItems: state.familyPlanItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  },

  resetKit: () => {
    set((state) => ({
      kitItems: state.kitItems.map((item) => ({ ...item, completed: false })),
    }));
  },

  resetFamilyPlan: () => {
    set((state) => ({
      familyPlanItems: state.familyPlanItems.map((item) => ({ ...item, completed: false })),
    }));
  },

  resetAllChecklists: () => {
    set((state) => ({
      kitItems: state.kitItems.map((item) => ({ ...item, completed: false })),
      familyPlanItems: state.familyPlanItems.map((item) => ({ ...item, completed: false })),
    }));
  },

  getKitProgress: () => {
    const items = get().kitItems;
    const completed = items.filter((i) => i.completed).length;
    const total = items.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  },

  getFamilyPlanProgress: () => {
    const items = get().familyPlanItems;
    const completed = items.filter((i) => i.completed).length;
    const total = items.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  },
}));

const PERSIST_KEY = 'checklists.v1';

/**
 * Persiste los checklists (mochila y plan familiar) en el almacén cifrado del dispositivo (RF-03).
 * Solo se guardan los ids completados; el resto del catálogo vive en este archivo. Se llama una vez al
 * arrancar (bootstrap), antes del primer render, para que la UI nunca muestre un estado a cero por error.
 */
export async function attachChecklistPersistence(store: KeyValueStore): Promise<void> {
  try {
    const raw = await store.get(PERSIST_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as { kit?: string[]; plan?: string[] };
      const kit = new Set(saved.kit ?? []);
      const plan = new Set(saved.plan ?? []);
      useChecklists.setState((s) => ({
        kitItems: s.kitItems.map((i) => ({ ...i, completed: kit.has(i.id) })),
        familyPlanItems: s.familyPlanItems.map((i) => ({ ...i, completed: plan.has(i.id) })),
      }));
    }
  } catch (err) {
    console.warn('[Checklists] no se pudo restaurar el estado guardado:', err);
  }

  useChecklists.subscribe((state) => {
    const snapshot = JSON.stringify({
      kit: state.kitItems.filter((i) => i.completed).map((i) => i.id),
      plan: state.familyPlanItems.filter((i) => i.completed).map((i) => i.id),
    });
    store.set(PERSIST_KEY, snapshot).catch((err) => console.warn('[Checklists] no se pudo guardar:', err));
  });
}
