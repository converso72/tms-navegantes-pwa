/**
 * Fuente única de verdad para la versión de la aplicación (Web PWA + APK Android)
 * Historial de versiones:
 * - v1.0.0: Lanzamiento inicial (60 versículos Los Navegantes RVR1960, 4 modos, SRS, IndexedDB)
 * - v1.1.0: Importador de grupos personalizados (Texto, Packs y JSON) + Integración Android Capacitor
 * - v1.2.0: Scroll interno en tarjetas largas, limpieza de cabecera superior y eliminación de etiqueta TMS
 * - v1.3.0: 9 Planes Oficiales (Navegantes + Fighter Verses) + Icono minimalista de Biblia abierta
 * - v1.4.0: Sistema de versionado visible en la interfaz, en Android (versionCode/versionName) y en el nombre del APK
 * - v1.5.0: Biblias completas Offline (RVR1960, NVI y NBLA) para buscar citas abreviadas (ej. Rom 1:21) y añadir más versículos a grupos existentes
 * - v1.6.0: Copia de seguridad Local y Google Drive, nuevo panel de Progreso (paquete semanal, repasos semanales y diarios), racha corregida y eliminación de Embudo/Heatmap
 * - v1.7.0: Soporte nativo Android (Capacitor Filesystem + Share) para guardar y recuperar copias en Google Drive y almacenamiento local
 * - v1.8.0: Eliminada la opción de repaso por Dictado (quedan 3 modos: Tarjeta 3D, Iniciales y Huecos)
 */
export const APP_VERSION = '1.8.0';
export const ANDROID_VERSION_CODE = 9;
export const VERSION_DATE = '2026-11-04';
export const VERSION_SUMMARY =
  'Eliminada la opción de repaso por Dictado (quedan Tarjeta 3D, Iniciales y Huecos)';
