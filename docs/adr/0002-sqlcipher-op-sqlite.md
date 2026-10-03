# ADR 0002 – SQLCipher vía op-sqlite (D-11)

- Estado: Aceptado, **sujeto a spike go/no-go en la Semana 2** · Decide: Juan Diego

## Contexto
RNF-04 exige AES-256 en reposo para la ficha médica.

## Decisión
SQLCipher con `@op-engineering/op-sqlite`. Alternativa 1: `react-native-quick-sqlite` con SQLCipher. Último recurso: SQLite estándar con cifrado AES-GCM por campo (clave en Keystore/Keychain).

## Consecuencias
La BD cifrada se abre solo con sesión desbloqueada. El spike mide tiempos de apertura y compatibilidad Android/iOS.
