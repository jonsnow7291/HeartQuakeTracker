# Casos de Aceptación de Interfaz de Usuario (UI) – EarthQuakeTracker (S-E11 / SA-023)

Este documento recopila las pruebas de aceptación de frontend en sintaxis Gherkin para verificar que cada Requisito Funcional (RF) y No Funcional (RNF) cumple con las expectativas de usuario, accesibilidad y comportamiento offline.

---

## RF-01: Guías Educativas Offline
```gherkin
Escenario: Lectura de guía sin conexión a internet
  Dado que el dispositivo se encuentra en modo avión
  Cuando el usuario ingresa a "/guides" y pulsa "Mochila de Emergencia"
  Entonces la guía debe desplegarse en pantalla en menos de 2 segundos
  Y el contenido debe mostrar los protocolos oficiales de la UNGRD y Cruz Roja
  Y no debe aparecer ningún mensaje de bloqueo por falta de red

Escenario: Detección de contenido corrupto (Flujo Alterno A1)
  Dado que los archivos locales de guías sufrieron corrupción de hash
  Cuando el usuario intenta abrir una guía afectada
  Entonces se debe mostrar la vista "ErrorState" con código CONTENT_CORRUPT
  Y se debe ofrecer un botón "Restaurar guías originales" que reinstale el paquete base

Escenario: Notificación de actualización en segundo plano (Flujo Alterno A2)
  Dado que el usuario tiene internet y el ContentService detecta una nueva versión de la guía
  Cuando el usuario está leyendo "/guides/mochila-emergencia"
  Entonces debe aparecer un banner superior discreto indicando "Nueva versión disponible"
  Y al pulsar el banner, el texto debe actualizarse sin recargar bruscamente la pantalla
```

---

## RF-02: Cuestionarios Interactivos y Autoevaluación
```gherkin
Escenario: Respuesta a una pregunta y feedback inmediato
  Dado que el usuario inicia el cuestionario del Nivel 1
  Cuando selecciona una de las 4 opciones de respuesta
  Entonces la interfaz debe colorear la opción y mostrar la tarjeta de explicación en menos de 1 segundo
  Y debe mostrar la referencia oficial del protocolo (protocolRef)

Escenario: Aprobación y desbloqueo de nivel (Regla D-33)
  Dado que el usuario finaliza las preguntas del Nivel 1 con una puntuación >= 70 %
  Cuando se renderiza la pantalla de resultados
  Entonces debe mostrarse el mensaje de nivel aprobado
  Y el Nivel 2 en "/quiz" debe cambiar su estado de "Bloqueado" a "Desbloqueado"

Escenario: Abandono y reanudación de intento parcial
  Dado que el usuario respondió 3 de 5 preguntas y cierra la aplicación
  Cuando el usuario regresa a "/quiz/nivel-1-basico"
  Entonces el sistema debe consultar "getPartial" en ProgressRepository
  Y la pantalla debe reanudar exactamente en la pregunta 4 conservando los puntos previos
```

---

## RF-03: Logros e Insignias Comunitarias
```gherkin
Escenario: Visualización de insignias obtenidas
  Dado que el usuario completó el Nivel 1 con puntaje perfecto
  Cuando ingresa a "/achievements"
  Entonces debe visualizar las insignias "Nivel 1 Completado" y "Perfecto" con estilo desbloqueado
  Y el porcentaje global de preparación comunitaria debe actualizarse al 100 % del nivel

Escenario: Restablecimiento total de progreso (Habeas Data A.8.10)
  Dado que el usuario desea eliminar sus registros de progreso
  Cuando pulsa "Restablecer y borrar progreso" y confirma la acción
  Entonces todas las insignias deben volver a estado bloqueado
  Y los intentos en ProgressRepository deben eliminarse
```

---

## RF-04: Ficha Médica Cifrada y Perfil
```gherkin
Escenario: Acceso protegido a la ficha médica
  Dado que el usuario tiene una sesión bloqueada
  Cuando navega a "/medical"
  Entonces la pantalla debe solicitar autenticación mediante PIN de 6 dígitos o biometría
  Y la información médica no debe mostrarse hasta que "unlock" sea exitoso

Escenario: Validación de campos obligatorios
  Dado que el usuario edita su ficha médica
  Cuando intenta guardar sin especificar grupo sanguíneo o contacto de emergencia
  Entonces el formulario debe marcar los campos faltantes en rojo con código VALIDATION
  Y no debe permitir guardar hasta subsanar los requisitos
```

---

## RF-05: Botón de Pánico y Cancelación
```gherkin
Escenario: Activación de pánico en menos de 2 toques (RNF-03)
  Dado que el usuario se encuentra en la pantalla de Inicio "/home"
  Cuando pulsa el PanicButton (Toque 1)
  Y selecciona la opción "ATRAPADO" (Toque 2)
  Entonces la pantalla pasa de inmediato al estado CONFIRMING con cuenta regresiva de 3 segundos
  Y no se exigen contraseñas, PIN ni desbloqueos de pantalla

Escenario: Cancelación accidental durante los 3 segundos
  Dado que el usuario activó el selector de gravedad por error
  Cuando pulsa "Cancelar pánico accidental" antes de que el contador llegue a cero
  Entonces el estado pasa a STOPPED y luego IDLE
  Y no se emite ninguna baliza BLE ni señal acústica
```

---

## RF-06: Señalización Visual (Flash Estroboscópico) y Sonora
```gherkin
Escenario: Activación de linterna y tono sonoro
  Dado que el pánico entró en estado ACTIVE
  Cuando el SignalingController recibe la notificación del servicio
  Entonces la linterna debe comenzar a destellar en patrón estroboscópico de 4 Hz en < 300 ms
  Y el altavoz debe reproducir un tono penetrante de 3 kHz a volumen máximo

Escenario: Teléfono en modo silencioso (Flujo Alterno A2)
  Dado que el usuario tiene el dispositivo en modo no molestar o volumen silenciado
  Cuando se activa la emergencia
  Entonces debe desplegarse un banner de advertencia visual instando al usuario a subir el volumen físico
```

---

## RF-07 y RF-08: Baliza BLE y Red Mallada P2P
```gherkin
Escenario: Visualización de estado de baliza activa
  Dado que el usuario tiene el modo de emergencia activo
  Cuando observa la pantalla "/emergency"
  Entonces debe ver el indicador "Baliza BLE Activa" emitiendo paquetes
  Y el contador de nodos cercanos debe reflejar los dispositivos detectados en un radio de 30 m

Escenario: Visualización de nodo vecino en estado de atrapamiento
  Dado que un teléfono cercano está transmitiendo pánico con gravedad "ATRAPADO"
  Cuando el usuario consulta los nodos de la malla
  Entonces ese nodo debe aparecer resaltado en rojo con prioridad máxima y distancia estimada
```

---

## RF-09: Sensores Sísmicos y Alertas
```gherkin
Escenario: Despliegue de banner por posible sismo
  Dado que el acelerómetro detecta aceleraciones bruscas compatibles con un sismo
  Cuando SensorService emite una alerta "POSSIBLE"
  Entonces debe aparecer un banner superior rojo en toda la aplicación
  Y debe ofrecer un acceso directo a la guía "Agáchate, Cúbrete y Agárrate"

Escenario: Dispositivo sin acelerómetro compatible
  Dado que el terminal carece de sensor de aceleración
  Cuando el usuario ingresa a "/alerts"
  Entonces se debe mostrar un mensaje informativo explicando que la detección se basará en la red comunitaria
```

---

## RF-10: Mapa de Socorro Offline de Bogotá
```gherkin
Escenario: Carga de mapa y puntos sin conexión
  Dado que el usuario descargó el paquete de tiles de Bogotá
  Cuando abre "/map" en modo avión
  Entonces el mapa vectorial debe renderizarse en menos de 2 segundos
  Y deben verse los iconos de Albergues, Acopio, Bomberos, Salud y Zonas Seguras

Escenario: Ausencia de mapa cacheado
  Dado que no se ha descargado la región de Bogotá
  Cuando el usuario abre "/map"
  Entonces debe desplegarse el estado "MAP_NOT_CACHED" con un botón para descargar el paquete
```

---

## RF-11: Directorio Oficial de Ayudas y Donaciones
```gherkin
Escenario: Consulta de canales oficiales
  Dado que el usuario ingresa a "/aid"
  Cuando visualiza las entidades de ayuda humanitaria (Cruz Roja, Defensa Civil, Bomberos)
  Entonces solo deben figurar canales verificados por el Estado
  Y al pulsar "Hacer donación", se debe redirigir al portal oficial externo sin procesar pagos en la app
```

---

## RF-12: Sincronización Store-and-Forward
```gherkin
Escenario: Encolado de reporte sin conexión
  Dado que el dispositivo no tiene internet
  Cuando el usuario completa un reporte de "Estoy a salvo" o "Reportar Daño"
  Entonces el reporte se almacena en la cola local
  Y la píldora de cabecera debe indicar "Pendiente de sincronizar (1)"

Escenario: Vaciado de cola al recuperar conectividad
  Dado que hay 2 reportes en cola y el dispositivo recupera señal de datos
  Cuando el usuario pulsa "Sincronizar ahora" o el sistema detecta red
  Entonces los reportes se envían al servidor y el contador pasa a cero
```

---

## RF-13: Modo Socorrista y Recepción de Ficha Médica
```gherkin
Escenario: Habilitación de modo socorrista mediante credencial
  Dado que un miembro de Defensa Civil abre "/rescuer"
  Cuando ingresa un código de organismo acreditado
  Entonces el sistema valida la credencial offline
  Y se activa la pantalla de recepción de fichas médicas de personas cercanas en < 3 segundos
```
