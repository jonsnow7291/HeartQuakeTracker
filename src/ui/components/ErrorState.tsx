import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ErrorCode } from '../../contracts/errors';
import { Button } from './Button';
import { lightPalette } from '../theme/theme';
import { spacing, typography } from '../theme/tokens';

export interface ErrorStateProps {
  code: ErrorCode;
  onRetry?: () => void;
  customMessage?: string;
}

interface ErrorDetails {
  title: string;
  message: string;
  actionText: string;
}

const ERROR_MAP: Record<ErrorCode, ErrorDetails> = {
  PERMISSION_DENIED: {
    title: 'Permiso requerido no otorgado',
    message: 'La aplicación necesita este permiso para poder emitir señales de auxilio o ubicarte en el mapa.',
    actionText: 'Abrir configuración',
  },
  BLUETOOTH_OFF: {
    title: 'Bluetooth desactivado',
    message: 'Para buscar personas cercanas o emitir tu baliza debes activar el Bluetooth.',
    actionText: 'Activar Bluetooth',
  },
  LOCATION_OFF: {
    title: 'Ubicación desactivada',
    message: 'Tu teléfono no puede determinar tus coordenadas para la alerta de rescate.',
    actionText: 'Activar ubicación',
  },
  NO_FLASH: {
    title: 'Linterna no disponible',
    message: 'Tu dispositivo no cuenta con flash o la linterna está siendo usada por otra app.',
    actionText: 'Continuar sin flash',
  },
  NO_SENSORS: {
    title: 'Sensores de movimiento no detectados',
    message: 'Tu dispositivo no cuenta con acelerómetro para detección sísmica local.',
    actionText: 'Usar alerta comunitaria',
  },
  CONTENT_CORRUPT: {
    title: 'Error en paquete educativo',
    message: 'Los archivos de las guías sufrieron un error de integridad.',
    actionText: 'Restaurar guías',
  },
  CONTENT_MISSING: {
    title: 'Contenido no encontrado',
    message: 'La guía seleccionada no se encuentra almacenada en la memoria del teléfono.',
    actionText: 'Volver a la lista',
  },
  STORAGE_FAILED: {
    title: 'Error de almacenamiento seguro',
    message: 'No se pudo guardar la información en la base de datos cifrada.',
    actionText: 'Reintentar guardado',
  },
  AUTH_REQUIRED: {
    title: 'Desbloqueo requerido',
    message: 'La ficha médica contiene datos protegidos. Ingresa tu PIN o usa tu huella.',
    actionText: 'Desbloquear ficha',
  },
  AUTH_FAILED: {
    title: 'PIN incorrecto',
    message: 'El PIN ingresado no coincide con el registrado en tu dispositivo.',
    actionText: 'Reintentar PIN',
  },
  MAP_NOT_CACHED: {
    title: 'Mapa no descargado',
    message: 'No tienes guardado el mapa vectorial para navegar sin internet en Bogotá.',
    actionText: 'Descargar mapa',
  },
  NETWORK_UNAVAILABLE: {
    title: 'Sin conexión a internet',
    message: 'La aplicación continúa funcionando en modo offline y guardará tus reportes.',
    actionText: 'Entendido',
  },
  SYNC_PARTIAL: {
    title: 'Sincronización incompleta',
    message: 'Algunos reportes se enviaron con éxito, pero otros quedaron en cola.',
    actionText: 'Reintentar sincronización',
  },
  RECEIVER_NOT_AUTHORIZED: {
    title: 'Código no válido',
    message: 'El código ingresado no corresponde a ningún organismo acreditado.',
    actionText: 'Verificar código',
  },
  VALIDATION: {
    title: 'Datos incompletos',
    message: 'Por favor completa todos los campos requeridos antes de continuar.',
    actionText: 'Revisar formulario',
  },
  UNKNOWN: {
    title: 'Error imprevisto',
    message: 'Ocurrió un error inesperado al procesar la operación.',
    actionText: 'Reintentar',
  },
};

export function ErrorState({ code, onRetry, customMessage }: ErrorStateProps) {
  const details = ERROR_MAP[code] || ERROR_MAP.UNKNOWN;

  return (
    <View style={styles.container} accessible={true} accessibilityRole="alert">
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>{details.title}</Text>
      <Text style={styles.message}>{customMessage || details.message}</Text>
      {onRetry ? (
        <Button
          title={details.actionText}
          onPress={onRetry}
          variant="primary"
          style={styles.button}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginVertical: spacing.xl,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.scale.title,
    color: lightPalette.panic,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.scale.bodyMedium,
    color: lightPalette.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.sm,
  },
});
