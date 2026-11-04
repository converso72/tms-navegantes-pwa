import React, { useState } from 'react';
import {
  Bell,
  Target,
  RotateCcw,
  ShieldCheck,
  Moon,
  Sun,
  Download,
  Upload,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertCircle,
  HardDrive,
} from 'lucide-react';
import type { UserSettings } from '../../types/schema';
import {
  requestNotificationPermission,
  triggerTestReminderNotification,
} from '../../lib/notifications';
import {
  downloadLocalBackupFile,
  shareBackupToGoogleDriveApp,
  restoreLatestLocalBackupFromDocuments,
  uploadBackupToGoogleDriveApi,
  restoreBackupFromGoogleDriveApi,
} from '../../lib/backup-drive';
import { restoreFullBackupPayload } from '../../db/dexie-db';
import { APP_VERSION, ANDROID_VERSION_CODE, VERSION_SUMMARY } from '../../version';

interface SettingsModalProps {
  settings: UserSettings;
  onUpdateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  onResetAllProgress: () => Promise<void>;
}

export const SettingsPanel: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetAllProgress,
}) => {
  const [backupMessage, setBackupMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isProcessingBackup, setIsProcessingBackup] = useState(false);
  const [showAdvancedDriveToken, setShowAdvancedDriveToken] = useState(false);
  const [driveAccessToken, setDriveAccessToken] = useState(
    () => localStorage.getItem('tms_gdrive_token') || ''
  );

  const handleToggleNotifications = async () => {
    if (!settings.notificationsEnabled) {
      const granted = await requestNotificationPermission();
      await onUpdateSettings({ notificationsEnabled: granted });
      if (granted) {
        triggerTestReminderNotification(settings.dailyGoalCards);
      }
    } else {
      await onUpdateSettings({ notificationsEnabled: false });
    }
  };

  // 1.a. Guardar copia de seguridad en el almacenamiento local
  const handleLocalExport = async () => {
    setIsProcessingBackup(true);
    setBackupMessage(null);
    try {
      const { locationLabel } = await downloadLocalBackupFile();
      setBackupMessage({
        type: 'success',
        text: `Copia guardada en ${locationLabel}. También se abrió el menú por si deseas enviarla a otra carpeta.`,
      });
    } catch (err: unknown) {
      setBackupMessage({
        type: 'error',
        text:
          err instanceof Error
            ? `Error al guardar copia local: ${err.message}`
            : 'No se pudo generar el archivo de copia de seguridad local.',
      });
    } finally {
      setIsProcessingBackup(false);
    }
  };

  // 1.b. Guardar directamente en la app de Google Drive del teléfono (o compartir en la nube)
  const handleShareToDrive = async () => {
    setIsProcessingBackup(true);
    setBackupMessage(null);
    try {
      const sharedNatively = await shareBackupToGoogleDriveApp();
      setBackupMessage({
        type: 'success',
        text: sharedNatively
          ? '¡Menú abierto! Toca el icono de "Google Drive" (Guardar en Drive) para subir tu copia.'
          : 'Archivo descargado listo para subir a tu Google Drive.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        (err instanceof Error && err.name === 'AbortError') ||
        msg.toLowerCase().includes('cancel') ||
        msg.toLowerCase().includes('dismiss')
      ) {
        setBackupMessage(null);
      } else {
        setBackupMessage({
          type: 'error',
          text: `No se pudo abrir Google Drive: ${msg}`,
        });
      }
    } finally {
      setIsProcessingBackup(false);
    }
  };

  // 1.c. Restauración rápida desde la carpeta Documentos del teléfono
  const handleQuickRestoreLocal = async () => {
    setIsProcessingBackup(true);
    setBackupMessage(null);
    try {
      const result = await restoreLatestLocalBackupFromDocuments();
      if (!result) {
        setBackupMessage({
          type: 'error',
          text: 'Usa el botón de arriba "Recuperar Copia" para elegir tu archivo .json.',
        });
        return;
      }
      setBackupMessage({
        type: 'success',
        text: `¡Restaurado desde Documentos (${result.fileName})! (${result.decksCount} grupos, ${result.cardsCount} versículos y ${result.logsCount} repasos).`,
      });
    } catch (err: unknown) {
      setBackupMessage({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'No se encontró copia automática en Documentos. Usa el botón de seleccionar archivo.',
      });
    } finally {
      setIsProcessingBackup(false);
    }
  };

  // 1.c. Recuperar copia de seguridad seleccionando el archivo (desde el móvil o desde Google Drive en el selector de archivos de Android)
  const handleRestoreFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingBackup(true);
    setBackupMessage(null);

    try {
      const rawJson = await file.text();
      const result = await restoreFullBackupPayload(rawJson);
      setBackupMessage({
        type: 'success',
        text: `¡Copia restaurada con éxito! (${result.decksCount} grupos, ${result.cardsCount} versículos y ${result.logsCount} repasos recuperados).`,
      });
    } catch (err: unknown) {
      setBackupMessage({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'El archivo seleccionado no es una copia de seguridad válida.',
      });
    } finally {
      setIsProcessingBackup(false);
      e.target.value = '';
    }
  };

  // Sincronización directa mediante API de Google Drive (Opcional con Token OAuth)
  const handleDirectDriveUpload = async () => {
    setIsProcessingBackup(true);
    setBackupMessage(null);
    try {
      localStorage.setItem('tms_gdrive_token', driveAccessToken.trim());
      await uploadBackupToGoogleDriveApi(driveAccessToken);
      setBackupMessage({
        type: 'success',
        text: '¡Copia subida directamente a tu Google Drive (los-navegantes-tms-backup.json)!',
      });
    } catch (err: unknown) {
      setBackupMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al subir a Google Drive API.',
      });
    } finally {
      setIsProcessingBackup(false);
    }
  };

  const handleDirectDriveRestore = async () => {
    setIsProcessingBackup(true);
    setBackupMessage(null);
    try {
      localStorage.setItem('tms_gdrive_token', driveAccessToken.trim());
      const result = await restoreBackupFromGoogleDriveApi(driveAccessToken);
      setBackupMessage({
        type: 'success',
        text: `¡Recuperado desde Google Drive! (${result.decksCount} grupos y ${result.cardsCount} versículos).`,
      });
    } catch (err: unknown) {
      setBackupMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al recuperar desde Google Drive API.',
      });
    } finally {
      setIsProcessingBackup(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Sección de Copia de Seguridad (Local y Google Drive) */}
      <div className="rounded-3xl p-5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E5DEC9] dark:border-[#332E2A] shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <HardDrive className="w-5 h-5 text-[#8C5A3C] dark:text-[#D4A373]" />
          <div>
            <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-[#2C2825] dark:text-[#F3EFEA]">
              Copia de Seguridad (Local y Google Drive)
            </h3>
            <p className="text-xs text-[#7D746B] dark:text-[#A39A90]">
              Guarda o recupera tus grupos personalizados, versículos, racha y progreso
            </p>
          </div>
        </div>

        {backupMessage && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-start gap-2 border ${
              backupMessage.type === 'success'
                ? 'bg-emerald-900/10 border-emerald-700/30 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-900/10 border-red-700/30 text-red-800 dark:text-red-300'
            }`}
          >
            {backupMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{backupMessage.text}</span>
          </div>
        )}

        {/* Botones principales de Crear Copia (Local y Google Drive App) */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={isProcessingBackup}
            onClick={handleLocalExport}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#F4F0E8] dark:bg-[#24201D] border border-[#E5DEC9] dark:border-[#332E2A] hover:border-[#8C5A3C] transition active:scale-95 text-center gap-1.5"
          >
            <Download className="w-5 h-5 text-[#8C5A3C] dark:text-[#D4A373]" />
            <span className="text-xs font-semibold text-[#2C2825] dark:text-[#F3EFEA]">
              Guardar en Local
            </span>
            <span className="text-[10px] text-[#7D746B] dark:text-[#9E958B]">
              Descargar archivo .json
            </span>
          </button>

          <button
            type="button"
            disabled={isProcessingBackup}
            onClick={handleShareToDrive}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#8C5A3C]/10 dark:bg-[#D4A373]/10 border border-[#8C5A3C]/30 hover:border-[#8C5A3C] transition active:scale-95 text-center gap-1.5"
          >
            <CloudUpload className="w-5 h-5 text-[#8C5A3C] dark:text-[#D4A373]" />
            <span className="text-xs font-semibold text-[#8C5A3C] dark:text-[#D4A373]">
              Guardar en Google Drive
            </span>
            <span className="text-[10px] text-[#7D746B] dark:text-[#9E958B]">
              Subir a tu nube Drive
            </span>
          </button>
        </div>

        {/* Botón de Recuperar Copia (permite elegir desde memoria interna o Google Drive en Android) */}
        <div className="space-y-2">
          <label className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#8C5A3C] hover:bg-[#74482E] text-white text-xs font-semibold cursor-pointer shadow-sm transition active:scale-95">
            <Upload className="w-4 h-4" />
            <span>Recuperar Copia (Elegir de Google Drive o Local)</span>
            <input
              type="file"
              accept="*/*"
              onChange={handleRestoreFromFile}
              className="hidden"
            />
          </label>

          <button
            type="button"
            disabled={isProcessingBackup}
            onClick={handleQuickRestoreLocal}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-[#F4F0E8] dark:bg-[#24201D] border border-[#E5DEC9] dark:border-[#332E2A] text-[#5A534C] dark:text-[#D4A373] text-xs font-semibold transition active:scale-95"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Restaurar última copia guardada en Documentos</span>
          </button>
        </div>

        <p className="text-[11px] text-[#7D746B] dark:text-[#9E958B] leading-relaxed">
          Al pulsar <strong>Recuperar Copia</strong> en Android, el selector de archivos te permite
          elegir tanto de la carpeta <em>Descargas</em> como directamente de tu cuenta de{' '}
          <strong>Google Drive</strong> en el menú lateral.
        </p>

        {/* Sincronización directa por API con Token de Google Drive (Opcional) */}
        <div className="pt-2 border-t border-[#EDE8DF] dark:border-[#2C2723]">
          <button
            type="button"
            onClick={() => setShowAdvancedDriveToken((v) => !v)}
            className="text-[11px] font-medium text-[#8C5A3C] dark:text-[#D4A373] hover:underline"
          >
            {showAdvancedDriveToken
              ? 'Ocultar conexión directa API de Google Drive'
              : '¿Usar conexión directa por Token de Google Drive API?'}
          </button>

          {showAdvancedDriveToken && (
            <div className="mt-2.5 p-3 rounded-2xl bg-[#F4F0E8] dark:bg-[#24201D] border border-[#E5DEC9] dark:border-[#332E2A] space-y-2.5">
              <input
                type="password"
                value={driveAccessToken}
                onChange={(e) => setDriveAccessToken(e.target.value)}
                placeholder="Pega aquí tu OAuth Access Token de Google Drive..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1C1917] border border-[#D5CBB8] dark:border-[#3E3832] text-xs font-mono"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isProcessingBackup}
                  onClick={handleDirectDriveUpload}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#8C5A3C] text-white text-xs font-semibold"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  Subir a Drive API
                </button>
                <button
                  type="button"
                  disabled={isProcessingBackup}
                  onClick={handleDirectDriveRestore}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#EFECE6] dark:bg-[#1C1917] text-[#2C2825] dark:text-[#F3EFEA] border border-[#D5CBB8] dark:border-[#3E3832] text-xs font-semibold"
                >
                  <CloudDownload className="w-3.5 h-3.5" />
                  Restaurar Drive API
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Meta diaria */}
      <div className="rounded-3xl p-5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E5DEC9] dark:border-[#332E2A] shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <Target className="w-5 h-5 text-[#8C5A3C] dark:text-[#D4A373]" />
          <div>
            <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-[#2C2825] dark:text-[#F3EFEA]">
              Meta Diaria de Repaso
            </h3>
            <p className="text-xs text-[#7D746B] dark:text-[#A39A90]">
              ¿Cuántos versículos deseas meditar cada día?
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[3, 5, 10, 15].map((goal) => {
            const active = settings.dailyGoalCards === goal;
            return (
              <button
                key={goal}
                type="button"
                onClick={() => onUpdateSettings({ dailyGoalCards: goal })}
                className={`py-2.5 rounded-2xl text-xs font-semibold border transition ${
                  active
                    ? 'bg-[#8C5A3C] text-white border-[#8C5A3C] shadow-sm'
                    : 'bg-[#F4F0E8] dark:bg-[#24201D] text-[#5A534C] dark:text-[#B8AFA6] border-[#E5DEC9] dark:border-[#332E2A]'
                }`}
              >
                {goal} / día
              </button>
            );
          })}
        </div>
      </div>

      {/* Recordatorios locales y Tema */}
      <div className="rounded-3xl p-5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E5DEC9] dark:border-[#332E2A] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-[#8C5A3C] dark:text-[#D4A373]" />
            <div>
              <h3 className="text-sm font-serif font-bold text-[#2C2825] dark:text-[#F3EFEA]">
                Recordatorio Diario Local
              </h3>
              <p className="text-xs text-[#7D746B] dark:text-[#A39A90]">
                Notificación en tu dispositivo para mantener la racha
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleNotifications}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
              settings.notificationsEnabled
                ? 'bg-emerald-700 text-white'
                : 'bg-[#EFECE6] dark:bg-[#2A2622] text-[#6E675F] dark:text-[#A39A90]'
            }`}
          >
            {settings.notificationsEnabled ? 'Activado' : 'Activar'}
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#EDE8DF] dark:border-[#2C2723]">
          <span className="text-xs text-[#6E675F] dark:text-[#A39A90]">
            Hora programada de meditación
          </span>
          <input
            type="time"
            value={settings.reminderTime}
            onChange={(e) => onUpdateSettings({ reminderTime: e.target.value })}
            className="px-3 py-1 rounded-xl bg-[#F4F0E8] dark:bg-[#24201D] border border-[#E5DEC9] dark:border-[#332E2A] text-xs font-mono"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#EDE8DF] dark:border-[#2C2723]">
          <div className="flex items-center gap-2">
            {settings.theme === 'dark' ? (
              <Moon className="w-4 h-4 text-[#D4A373]" />
            ) : (
              <Sun className="w-4 h-4 text-[#8C5A3C]" />
            )}
            <span className="text-xs font-medium text-[#2C2825] dark:text-[#F3EFEA]">
              Apariencia Editorial
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
            }
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#EFECE6] dark:bg-[#2A2622] text-[#8C5A3C] dark:text-[#D4A373]"
          >
            {settings.theme === 'dark' ? 'Modo Oscuro (Carbón)' : 'Modo Claro (Pergamino)'}
          </button>
        </div>
      </div>

      {/* Información Offline-First & Reinicio */}
      <div className="rounded-3xl p-5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E5DEC9] dark:border-[#332E2A] shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Biblias RVR1960, NVI y NBLA sincronizadas 100% Offline</span>
        </div>

        <div className="pt-2 border-t border-[#EDE8DF] dark:border-[#2C2723] flex items-center justify-between">
          <div className="text-[11px] font-mono text-[#8C5A3C] dark:text-[#D4A373]">
            Versión <strong>v{APP_VERSION}</strong> (Build #{ANDROID_VERSION_CODE})
          </div>
          <button
            type="button"
            onClick={onResetAllProgress}
            className="inline-flex items-center gap-1.5 text-xs text-red-700 dark:text-red-400 hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer progreso
          </button>
        </div>
        <p className="text-[10px] text-[#8A8178] dark:text-[#7D746B]">
          Notas de versión: {VERSION_SUMMARY}
        </p>
      </div>
    </div>
  );
};
