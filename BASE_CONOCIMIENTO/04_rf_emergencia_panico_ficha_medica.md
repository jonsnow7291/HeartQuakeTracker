# 04 – RF de emergencia: ficha médica, pánico, señalización y exportación (RF-04, RF-05, RF-06, RF-13)

Todos Prioridad Alta. Versión 1.0.

## RF-04 – Gestión de ficha médica de emergencia
- **ISO:** A.5.34 Privacidad / A.8.24 Criptografía. **Actor:** Ciudadano.
- **Descripción:** registrar, editar y almacenar **cifrada** una ficha mínima: tipo de sangre, alergias, enfermedades preexistentes, contactos clave.
- **Precondición:** usuario con sesión iniciada.
- **Flujo:** 1) módulo ficha médica → 2) formulario → 3) ingresa/edita → 4) confirma y guarda → 5) el sistema cifra y guarda local.
- **Alternos:** A1 campos obligatorios vacíos → mensaje. A2 ya existe ficha → editar en vez de crear.
- **Postcondición:** ficha cifrada y disponible para transmisión en emergencia.
- **Aceptación:** guardada con **AES-256**, accesible solo con autenticación del usuario.
- **Notas [INFERIDO]:** SQLCipher; clave derivada guardada en Keystore (Android) / Keychain (iOS); consentimiento Ley 1581 de 2012 al primer uso; una sola ficha por usuario.

## RF-05 – Botón de pánico / UI de crisis
- **ISO:** A.8.16 Monitoreo. **Actor:** Ciudadano en emergencia.
- **Descripción:** interfaz accesible en **máximo 2 toques** para activar modo emergencia.
- **Precondición:** app abierta o en segundo plano con permisos activos.
- **Flujo:** 1) percibe sismo → 2) pantalla principal → 3) presiona botón de pánico → 4) el sistema pide nivel de gravedad (**Ileso, Con Lesiones, Atrapado**) → 5) selecciona → 6) se activa el modo de emergencia.
- **Alternos:** A1 error de pulsación → cancelar dentro de **3 s**. A2 faltan permisos GPS/Bluetooth → solicitarlos antes de continuar.
- **Postcondición:** modo emergencia activo; se disparan señalización (RF-06) y baliza BLE (RF-07).
- **Aceptación:** ≤ 2 toques y respuesta de UI **< 300 ms**.
- **Diseño:** alto contraste, WCAG 2.1 AA (RNF-03).

## RF-06 – Señalización física de rescate
- **ISO:** A.8.16. **Actor:** Ciudadano en emergencia.
- **Descripción:** al activar pánico, pulso **estroboscópico con flash LED** y **tono acústico continuo** de alta penetración.
- **Precondición:** modo emergencia activo; flash y audio funcionales.
- **Flujo:** 1) detecta activación → 2) flash estroboscópico → 3) tono de alta frecuencia simultáneo → 4) mantiene hasta que el usuario detenga o se agote batería.
- **Alternos:** A1 sin flash → solo acústico. A2 dispositivo silenciado → alerta visual recomendando reactivar sonido.
- **Aceptación:** flash y tono activos en **< 300 ms** tras confirmar la emergencia.
- **Relación:** consumo de batería (R-04, modo "SOS Prolongado" en `09`).

## RF-13 – Exportación de ficha médica a organismos de socorro
- **ISO:** A.5.34 / A.8.24. **Actor:** Ciudadano en emergencia.
- **Descripción:** transmisión **por proximidad** (BLE / Wi-Fi Direct) de la ficha médica comprimida a terminales autorizados de socorristas.
- **Precondición:** ficha registrada y modo emergencia activo.
- **Flujo:** 1) detecta emergencia con ficha → 2) comprime la ficha en paquete reducido → 3) transmite por BLE/Wi-Fi Direct a terminales autorizados → 4) el terminal receptor valida y muestra la ficha.
- **Alternos:** A1 sin terminal autorizado en rango → mantiene la ficha lista y la envía al detectar uno. A2 ficha incompleta → transmite solo campos disponibles e indica al receptor.
- **Aceptación:** transmisión en **< 3 s** hacia terminal autorizado en rango.
- **Notas [INFERIDO]:** requiere app/modo "Socorrista" o terminal autorizado con credencial/firma; payload cifrado y con ID efímero (ver R-01); validar al receptor antes de descifrar. El documento no especifica el formato del terminal receptor (ver `16`).

## Estados de gravedad (enum compartido con RF-07)
`ILESO | CON_LESIONES | ATRAPADO`

## Secuencia de activación (resumen)
Botón → selección de gravedad → [cancelable 3 s] → modo emergencia ON → { flash+tono (RF-06), baliza BLE con id+gravedad+GPS (RF-07), escaneo/relé mesh (RF-08), ficha médica a socorristas en rango (RF-13), encolado para sync (RF-12) }.
