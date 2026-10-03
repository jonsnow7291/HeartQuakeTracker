# Consentimiento Informado y Tratamiento de Datos Personales (Habeas Data)

**Marco Legal:** Ley Estatutaria 1581 de 2012 y Decreto 1377 de 2013 (República de Colombia).

Bienvenido a **EarthQuakeTracker**. Antes de habilitar tu perfil de emergencia y ficha médica, es indispensable que conozcas y aceptes de forma voluntaria, previa y expresa el tratamiento de tus datos personales.

## 1. Responsable del Tratamiento
La aplicación EarthQuakeTracker funciona bajo una arquitectura **local y descentralizada**. Tus datos personales sensibles no son centralizados en ningún servidor en la nube sin tu orden expresa. El custodio primario de la clave criptográfica reside en el almacén de seguridad de tu propio dispositivo móvil (Keystore en Android o Keychain en iOS).

## 2. Naturaleza de los Datos Tratados
* **Datos Generales:** Nombre para mostrar o alias de emergencia.
* **Datos Sensibles de Salud (Ficha Médica):** Grupo sanguíneo, alergias conocidas, condiciones médicas preexistentes, medicamentos esenciales y números de teléfono de contactos de emergencia.
* **Datos Geográficos:** Coordenadas de latitud y longitud capturadas por el sensor GPS exclusivamente para propósitos de georreferenciación de auxilio.

## 3. Finalidad Exclusiva
Los datos recopilados tienen como **único propósito** la salvaguarda de la vida y la integridad física del titular en situaciones de emergencia, desastres naturales o colapso de infraestructura, permitiendo:
1. Proveer información médica vital de forma inmediata a socorristas acreditados mediante transmisión Bluetooth de proximidad (GATT cifrado) cuando la persona activa el modo pánico.
2. Adjuntar las coordenadas del lugar de atrapamiento a la baliza de socorro comunitaria.
3. Permitir el reporte voluntario de estado "Estoy a salvo" a las entidades de socorro.

## 4. Medidas de Seguridad y Cifrado
* Tu información médica se almacena en una base de datos local cifrada mediante **SQLCipher (AES-256)**.
* La transmisión por proximidad a personal de socorro utiliza cifrado de clave pública asimétrica (**X25519 y XChaCha20-Poly1305**), impidiendo que terceros no autorizados puedan interceptar o leer tu información de salud en el aire.
* Se utilizan identificadores efímeros rotativos cada 15 minutos para evitar el rastreo pasivo de tu dispositivo.

## 5. Derechos del Titular (Habeas Data)
Como titular de la información tienes derecho en cualquier momento a:
* Conocer, actualizar y rectificar tus datos personales.
* Suprimir la información médica de tu dispositivo de manera definitiva mediante la opción "Restablecer y Borrar Ficha" en los ajustes.
* Revocar la autorización otorgada sin perjuicio del uso de los módulos educativos y mapas de la aplicación.

Al pulsar **"Acepto el Consentimiento de Datos"**, manifiestas haber leído este documento y autorizas el tratamiento de tus datos para los fines de protección y auxilio aquí descritos.
