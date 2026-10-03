import { AidDirectoryService, AidEntity, AidNeed } from '../../contracts/aid';

export class MockAidDirectoryService implements AidDirectoryService {
  public async listEntities(): Promise<AidEntity[]> {
    return [
      {
        id: 'ent_01',
        name: 'Cruz Roja Colombiana',
        kind: 'SOCORRO',
        description: 'Atención prehospitalaria, búsqueda y rescate, y apoyo psicosocial.',
        active: true,
        verifiedAt: new Date().toISOString(),
        channels: [
          { type: 'TEL', value: '132', requirements: 'Línea nacional gratuita de auxilio', active: true },
          { type: 'WEB', value: 'https://www.cruzrojacolombiana.org', active: true },
        ],
      },
      {
        id: 'ent_02',
        name: 'Defensa Civil Colombiana',
        kind: 'SOCORRO',
        description: 'Gestión social del riesgo, voluntariado y primeros auxilios comunitarios.',
        active: true,
        verifiedAt: new Date().toISOString(),
        channels: [
          { type: 'TEL', value: '144', active: true },
          { type: 'WEB', value: 'https://www.defensacivil.gov.co', active: true },
        ],
      },
      {
        id: 'ent_03',
        name: 'Cuerpo Oficial de Bomberos de Bogotá',
        kind: 'GOBIERNO',
        description: 'Control de incendios, fugas de gas, rescate en estructuras colapsadas (USAR).',
        active: true,
        verifiedAt: new Date().toISOString(),
        channels: [
          { type: 'TEL', value: '119', active: true },
        ],
      },
    ];
  }

  public async listNeeds(): Promise<AidNeed[]> {
    return [
      { id: 'need_01', category: 'ALIMENTOS', label: 'Alimentos no perecederos y agua embotellada', urgency: 'ALTA' },
      { id: 'need_02', category: 'SALUD', label: 'Gasas, vendas elásticas y suero fisiológico', urgency: 'ALTA' },
      { id: 'need_03', category: 'ABRIGO', label: 'Mantas térmicas y colchonetas impermeables', urgency: 'MEDIA' },
    ];
  }
}
