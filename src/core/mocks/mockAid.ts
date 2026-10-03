import { AidDirectoryService, AidEntity, AidNeed } from '../../contracts/aid';

export class MockAidDirectoryService implements AidDirectoryService {
  public async listEntities(): Promise<AidEntity[]> {
    return [
      {
        id: 'defensa-civil-colombiana',
        name: 'Defensa Civil Colombiana',
        kind: 'SOCORRO',
        description: 'Institución social y humanitaria del Estado colombiano para la gestión del riesgo de desastres y acción social.',
        active: true,
        verifiedAt: '2026-10-03T00:00:00Z',
        channels: [
          { type: 'TEL', value: '144', active: true },
          { type: 'WEB', value: 'https://www.defensacivil.gov.co', active: true },
        ],
      },
      {
        id: 'ungrd',
        name: 'Unidad Nacional para la Gestión del Riesgo de Desastres (UNGRD)',
        kind: 'GOBIERNO',
        description: 'Entidad coordinadora del Sistema Nacional de Gestión del Riesgo de Desastres en Colombia.',
        active: true,
        verifiedAt: '2026-10-03T00:00:00Z',
        channels: [
          { type: 'WEB', value: 'https://portal.gestiondelriesgo.gov.co', active: true },
        ],
      },
      {
        id: 'cruz-roja-colombiana',
        name: 'Cruz Roja Colombiana',
        kind: 'SOCORRO',
        description: 'Organización humanitaria de socorro y voluntariado para la atención de emergencias y desastres en el territorio nacional.',
        active: true,
        verifiedAt: '2026-10-03T00:00:00Z',
        channels: [
          { type: 'TEL', value: '132', requirements: 'Línea nacional gratuita de auxilio', active: true },
          { type: 'WEB', value: 'https://www.cruzrojacolombiana.org', active: true },
        ],
      },
      {
        id: 'idiger',
        name: 'Instituto Distrital de Gestión de Riesgos y Cambio Climático (IDIGER)',
        kind: 'GOBIERNO',
        description: 'Entidad distrital técnica responsable de coordinar el Sistema Distrital de Gestión del Riesgo y Cambio Climático en Bogotá D.C.',
        active: true,
        verifiedAt: '2026-10-03T00:00:00Z',
        channels: [
          { type: 'TEL', value: '123', active: true },
          { type: 'WEB', value: 'https://www.idiger.gov.co', active: true },
        ],
      },
    ];
  }

  public async listNeeds(): Promise<AidNeed[]> {
    return [
      {
        id: 'need-agua-potable',
        category: 'VIVERES',
        label: 'Agua potable embotellada o en bolsa',
        urgency: 'ALTA',
      },
      {
        id: 'need-alimentos-no-perecederos',
        category: 'VIVERES',
        label: 'Alimentos no perecederos y enlatados con abrelatas',
        urgency: 'ALTA',
      },
      {
        id: 'need-primeros-auxilios',
        category: 'SALUD',
        label: 'Kits de primeros auxilios y material de curación estéril',
        urgency: 'ALTA',
      },
      {
        id: 'need-medicamentos-esenciales',
        category: 'SALUD',
        label: 'Medicamentos esenciales (analgésicos, antisépticos y sueros orales)',
        urgency: 'ALTA',
      },
      {
        id: 'need-kit-higiene',
        category: 'HIGIENE',
        label: 'Kits de higiene personal (jabón, toallas higiénicas, papel y pañales)',
        urgency: 'MEDIA',
      },
      {
        id: 'need-cobijas-colchonetas',
        category: 'ABRIGO',
        label: 'Cobijas térmicas, frazadas y colchonetas livianas',
        urgency: 'MEDIA',
      },
      {
        id: 'need-linternas-baterias',
        category: 'EQUIPAMIENTO',
        label: 'Linternas recargables o LED con baterías AA/AAA',
        urgency: 'MEDIA',
      },
      {
        id: 'need-ropa-impermeable',
        category: 'ABRIGO',
        label: 'Ropa impermeable y abrigada en buen estado (adultos y niños)',
        urgency: 'BAJA',
      },
    ];
  }
}
