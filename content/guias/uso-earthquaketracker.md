---
id: uso-earthquaketracker
title: Cómo Usar EarthQuakeTracker en una Emergencia
summary: Guía práctica para activar el botón de pánico, emitir balizas BLE offline y compartir tu ficha médica
category: OTRO
version: 1.0.0
readMin: 4
sources: ["EarthQuakeTracker", "UNGRD", "Cruz Roja Colombiana"]
---

# Cómo Usar EarthQuakeTracker en una Emergencia

EarthQuakeTracker está diseñada para operar de forma 100 % autónoma sin depender de conexión a internet ni cobertura de telefonía celular gracias a su arquitectura descentralizada de radio Bluetooth Low Energy (BLE).

## 1. Activación Rápida del Botón de Pánico
En caso de encontrarte en peligro inminente:
* **Acceso en Dos Toques:** Abre la aplicación e ingresa de inmediato a la pestaña de emergencia pulsando el botón central de Pánico.
* **Selección de Gravedad:** Elige tu condición entre tres opciones críticas:
  - *Estoy Ileso:* Notifica a tus vecinos que te encuentras a salvo y colaboras como nodo de retransmisión.
  - *Tengo Lesiones:* Solicita apoyo de primeros auxilios a personas y brigadistas en el radio de alcance.
  - *Estoy Atrapado:* Emite máxima prioridad de auxilio a los grupos de búsqueda y rescate urbano.
* **Ventana de Cancelación (3 segundos):** Dispones de 3 segundos con cuenta regresiva para cancelar la emisión si pulsaste el botón accidentalmente.

## 2. Baliza de Socorro BLE y Red Mallada
Una vez confirmada la emergencia:
* **Emisión Continua:** Tu teléfono transmite un paquete de radio BLE cifrado que incluye tus coordenadas GPS o última ubicación conocida y nivel de gravedad.
* **Red en Malla (Mesh):** Los teléfonos cercanos con la app retransmiten tu señal de salto en salto (hasta 4 saltos de distancia), amplificando el radio de búsqueda hasta alcanzar a un socorrista o nodo con conexión.
* **Sin Consumo de Datos Móviles:** La baliza funciona enteramente por hardware Bluetooth local.

## 3. Señalización Óptica y Acústica de Auxilio
Para facilitar tu localización visual y auditiva entre escombros o en la oscuridad:
* **Linterna Estroboscópica (4 Hz):** El flash de la cámara parpadea a una frecuencia perceptible de 4 pulsos por segundo sin calentar en exceso el dispositivo.
* **Tono Acústico de 3 kHz:** El altavoz emite una señal sonora estridente calibrada en la banda de máxima sensibilidad del oído humano. Puedes silenciarla o reactivarla según tu criterio.

## 4. Ficha Médica para Socorristas Autorizados
* **Cifrado Local:** Tu ficha médica (grupo sanguíneo, alergias, enfermedades crónicas, medicamentos y contactos) se almacena cifrada bajo el estándar AES-256 en tu propio dispositivo.
* **Modo Socorrista:** Cuando un brigadista de la Cruz Roja, Defensa Civil o Bomberos introduce su código de credencial oficial en la app, puede sincronizar y leer tu ficha médica por BLE en menos de 3 segundos para tomar decisiones clínicas oportunas.

## 5. Gestión Eficiente de Batería
* Si la batería baja del 20 %, la aplicación entra en modo de bajo consumo, espaciando los intervalos de publicidad Bluetooth para prolongar la emisión de socorro durante horas críticas.
