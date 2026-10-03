# 02 – Análisis estratégico: DOFA, buyer persona y customer journey

(Fuente: imágenes del docx principal.)

## Matriz DOFA
**Fortalezas**
- Integra prevención, respuesta y seguimiento en una sola app.
- Conecta ciudadanos con entidades de emergencia (Bomberos, Defensa Civil).
- Acceso rápido a material educativo y protocolos.
- Acceso desde móviles.
- Reportes y comunicación colaborativa.
- Apoya la toma de decisiones institucional (priorizar, seguimiento).
- Enfoque socioambiental y de impacto comunitario.

**Oportunidades**
- Educar y reducir el miedo ante un sismo.
- Reducir el tiempo de respuesta de ayuda.
- Cerrar brechas de comunicación gobierno–pueblo.
- Cadenas colaborativas de donaciones vía apps.

**Debilidades**
- Infraestructura precaria en regiones periféricas; poca asistencia estatal en catástrofes.
- Poco material educativo.
- La gente no sabe qué hacer en el momento.
- Falta de comunicación entre ciudadanos.

**Amenazas**
- Fallas de red/energía/telefonía durante la catástrofe.
- Información falsa o reportes no verificados.
- Baja adopción por población o instituciones.
- Limitaciones de conectividad en zonas rurales.
- Dependencia de la colaboración institucional.
- Riesgos de seguridad y privacidad de datos personales/ubicaciones.

**Implicaciones de diseño:** offline-first (amenaza 1), firmas/verificación de alertas (amenaza 2), onboarding simple y capacitación (amenaza 3), cifrado y Habeas Data (amenaza 6).

## Buyer persona corporativo: Defensa Civil Colombiana
- **Perfil:** entidad pública humanitaria, cobertura nacional, +500 funcionarios y voluntarios, Dirección Nacional + Seccionales.
- **Roles de decisión:** Director Nacional (estratégico), Coordinador de Gestión del Riesgo (evalúa/implementa), Jefe de Operaciones (campo), Líder de Tecnología y Sistemas (viabilidad técnica), Líder de Comunicaciones.
- **Necesidades:** mejorar preparación y educación; detectar/monitorear sismos sin conectividad; centralizar reportes y priorizar recursos; fortalecer comunicación en emergencia; decidir con datos.
- **Dolor:** dificultades de coordinación, comunicación y disponibilidad de información en tiempo real durante/después del sismo; limitaciones en educación y preparación.
- **Qué busca en un proveedor:** experiencia en emergencias, solución segura y escalable, soporte continuo, cumplimiento de seguridad/datos, adaptabilidad, relación transparente.
- **Propuesta de valor (6 pilares):** Prevención (módulos y gamificación offline-first) · Detección (sensores móviles colaborativos) · Comunicación (malla Bluetooth sin internet) · Respuesta (botón de pánico, reportes en tiempo real) · Gestión (mapas, zonas afectadas, priorización de recursos) · Sincronización (cuando hay conexión).
- **Modelo de negocio:** SaaS + app móvil: licenciamiento, implementación, capacitación, soporte, mantenimiento.
- **Implicación:** existe un **lado institucional** (panel/dashboard de reportes, recursos, zonas afectadas) además de la app ciudadana. El panel institucional no está especificado en los RF (ver `16`).

## Customer journey (7 etapas, cliente institucional)
| Etapa | Qué ocurre | Emoción | Dolor | Oportunidad |
| --- | --- | --- | --- | --- |
| 1 Identificación | Defensa Civil detecta fallas de comunicación/prevención | Preocupación | Falta de preparación y comunicación | Presentar solución integral |
| 2 Descubrimiento | Conoce la app por presentación/propuesta | Curiosidad | Desconoce herramientas | Mostrar valor |
| 3 Evaluación | Analiza funciones, seguridad, viabilidad; prueba prototipo | Expectativa | Dudas de seguridad/viabilidad | Prototipo funcional y claro |
| 4 Adopción | Capacitación y adopción en entidad/comunidades | Confianza | Resistencia al cambio | Facilitar capacitación |
| 5 Emergencia | Sismo: app como herramienta (pánico, BLE, mapas, reportes) | Urgencia | Redes saturadas, información dispersa | Offline-First + BLE + reportes + mapas |
| 6 Recuperación | Se revisan reportes y necesidades; dashboard/historial/sincronización | Satisfacción/aprendizaje | Falta de información consolidada | Generar info para mejorar |
| 7 Retroalimentación | Se refuerzan estrategias y capacitaciones | Motivación | Sostener motivación y uso | Consolidar alianzas |

Flujo de actores: Defensa Civil capacita → ciudadanos usan la app → ocurre el sismo (reportan/solicitan ayuda) → entidades de respuesta reciben/gestionan → post-emergencia (seguimiento) → retroalimentación.
