# 12 – Presupuesto y costos

Moneda COP. TRM de referencia: **$3.344,62 COP/USD**. Total cerrado: **$100.000.000 COP**. Emisión 26-sep-2026.
Destinatario: organismos de socorro y gestión del riesgo (Defensa Civil, UNGRD, ARL, sector corporativo).

## Resumen
| Cat. | Concepto | COP | % |
| --- | --- | --- | --- |
| 1.0 | Talento humano y desarrollo | 53.275.000 | 53,28 |
| 2.0 | Laboratorio de hardware y banco de pruebas BLE | 8.000.000 | 8,00 |
| 3.0 | Licencias, tiendas y herramientas | 1.100.000 | 1,10 |
| 4.0 | Infraestructura cloud y cartografía | 6.300.000 | 6,30 |
| 5.0 | Cumplimiento legal (Habeas Data) y ciberseguridad | 8.000.000 | 8,00 |
| 6.0 | Fondo de reserva para contingencias | 23.325.000 | 23,32 |
| | **Total** | **100.000.000** | 100 |

## 1.0 Talento humano (4 meses)
| Rol | Tarifa (fuente de mercado) | Dedicación | Total |
| --- | --- | --- | --- |
| Lead Mobile Developer | $6.500.000/mes (Indeed) | 100 % | 26.000.000 |
| Backend Developer | $5.100.000/mes (Indeed Bogotá) | 100 % | 20.400.000 |
| Consultor UI/UX | $75.000/h (Computrabajo) | 45 h | 3.375.000 |
| QA & Hardware Tester | $3.500.000/mes (Indeed) | 50 % meses 3–4 | 3.500.000 |

## 2.0 Hardware y pruebas BLE
- Device farm 6–8 móviles gama baja/media/alta (Xiaomi, Samsung A, Moto G, iPhone; $450k–$1,2M c/u): **$7.000.000**.
- Kit sniffer: 2× dongle nRF52840 ($11,69 USD), 1× nRF52840-DK ($48,95 USD), fletes e impuestos DIAN; captura canales advertising 37/38/39 en Wireshark y RSSI: **$1.000.000**.

## 3.0 Licencias
Apple Developer $99/año (331.117) · Google Play $25 único (83.616) · GitHub Copilot $20/mes × 2 devs × 4 meses (535.139) · Affinity $0 · Dominio .app + SSL gratuito Let's Encrypt (150.128) → **$1.100.000**.

## 4.0 Infraestructura
Hosting cloud/VPS/BaaS (PostgreSQL + S3; 4 meses desarrollo + 6 meses marcha blanca; Supabase/DigitalOcean) **$4.800.000** · Tiles offline OSM/MBTiles de zonas de alto riesgo **$1.500.000**.

## 5.0 Legal y seguridad
Asesoría Habeas Data (Ley 1581/2012) **$4.500.000** · Auditoría de ciberseguridad (pentest SQLCipher, firmas anti-spoofing; ISO/IEC 27001) **$3.500.000**.

## 6.0 Reserva
$23.325.000: horas especializadas C++/Swift ante cambios de batería Android 15/iOS 18, reemplazo de terminales, imprevistos.

## Plan de pagos
Anticipo 30 % = 30.000.000 · Hito 1 30 % = 30.000.000 · Hito 2 25 % = 25.000.000 · Cierre 15 % = 15.000.000.

## Fuentes de precios (resumen)
Indeed Colombia (salarios mobile/backend/QA), Computrabajo (UI/UX), DigiKey/Mouser (nRF52840), Apple Developer, Google Play Console, GitHub Copilot, Affinity, Porkbun, Let's Encrypt, Supabase, DigitalOcean, OpenMapTiles/Protomaps, SIC (Ley 1581), Zetetic SQLCipher. URLs en el docx `Propuesta Técnica y Económica.docx` §6.
