import { ContentService, GuideMeta, QuizBank } from '../../contracts/content';
import { MockDevScenarioController } from './mockDevScenarios';

export class MockContentService implements ContentService {
  private devController?: MockDevScenarioController;

  private guides: GuideMeta[] = [
    {
      id: 'mochila-emergencia',
      title: 'Mochila de Emergencia (72 Horas)',
      summary: 'Elementos indispensables para subsistir las primeras 72 horas tras un desastre sísmico.',
      category: 'MOCHILA',
      version: '1.0.0',
      readMin: 4,
    },
    {
      id: 'aseguramiento-estructural',
      title: 'Aseguramiento No Estructural del Hogar',
      summary: 'Cómo identificar y fijar objetos pesados que pueden causar lesiones durante un sismo.',
      category: 'ESTRUCTURAL',
      version: '1.0.0',
      readMin: 5,
    },
    {
      id: 'plan-familiar',
      title: 'Plan Familiar de Emergencia',
      summary: 'Guía paso a paso para organizar la respuesta de tu hogar antes, durante y después.',
      category: 'PLAN_FAMILIAR',
      version: '1.0.0',
      readMin: 4,
    },
    {
      id: 'durante-el-sismo',
      title: 'Qué Hacer Durante el Sismo',
      summary: 'Protocolo internacional de autoprotección Agáchate, Cúbrete y Agárrate.',
      category: 'OTRO',
      version: '1.0.0',
      readMin: 3,
    },
    {
      id: 'despues-del-sismo',
      title: 'Qué Hacer Después del Sismo',
      summary: 'Protocolo para evaluar daños, cerrar servicios y prevenir incendios secundarios.',
      category: 'OTRO',
      version: '1.0.0',
      readMin: 4,
    },
  ];

  constructor(devController?: MockDevScenarioController) {
    this.devController = devController;
  }

  public async listGuides(): Promise<GuideMeta[]> {
    if (this.devController?.isScenarioActive('contenido_corrupto')) {
      const err = new Error('Integridad de guías corrupta');
      (err as any).code = 'CONTENT_CORRUPT';
      throw err;
    }
    return [...this.guides];
  }

  public async getGuideMarkdown(id: string): Promise<string> {
    if (this.devController?.isScenarioActive('contenido_corrupto')) {
      const err = new Error('Integridad de guías corrupta');
      (err as any).code = 'CONTENT_CORRUPT';
      throw err;
    }

    const guide = this.guides.find((g) => g.id === id);
    if (!guide) {
      const err = new Error('Guía no encontrada');
      (err as any).code = 'CONTENT_MISSING';
      throw err;
    }

    return `# ${guide.title}\n\n**Tiempo estimado:** ${guide.readMin} minutos | **Categoría:** ${guide.category}\n\n## Recomendaciones Oficiales\n\n1. Mantén la serenidad en todo momento.\n2. Sigue las instrucciones de Defensa Civil y UNGRD.\n3. Revisa periódicamente las fechas de caducidad de tu botiquín.\n\n> Esta guía se encuentra almacenada de forma offline en tu dispositivo.`;
  }

  public async checkUpdates(): Promise<{ available: boolean; applied: boolean }> {
    return { available: false, applied: false };
  }

  public async getQuizBank(): Promise<QuizBank> {
    return {
      levels: [
        {
          id: 'nivel-1-basico',
          order: 1,
          title: 'Nivel 1: Conceptos Básicos y Autoprotección',
          questions: [
            {
              id: 'q001',
              text: '¿Cuál es la acción inmediata recomendada durante un sismo si estás en interiores?',
              options: [
                'Correr rápidamente hacia la calle',
                'Agacharse, cubrirse bajo un mueble resistente y agarrarse',
                'Ubicarse debajo del marco de una puerta cualquiera',
                'Tomar el ascensor para evacuar rápido',
              ],
              correctIndex: 1,
              explanation: 'El protocolo internacional Agáchate, Cúbrete y Agárrate previene traumatismos por objetos desprendidos.',
              protocolRef: 'UNGRD - Autoprotección',
              guideId: 'durante-el-sismo',
            },
            {
              id: 'q002',
              text: '¿Para cuántas horas de autonomía mínima debe estar preparada la mochila de emergencia?',
              options: ['12 horas', '24 horas', '72 horas', '1 semana completa'],
              correctIndex: 2,
              explanation: 'Los organismos de socorro recomiendan provisiones para al menos 72 horas.',
              protocolRef: 'Cruz Roja Colombiana',
              guideId: 'mochila-emergencia',
            },
          ],
        },
      ],
    };
  }
}
