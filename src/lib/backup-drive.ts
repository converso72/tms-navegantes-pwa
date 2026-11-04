/**
 * Utilidades de Copia de Seguridad Local y en Google Drive (`appdata` / `drive.file`)
 * Soporta:
 * 1. Descarga directa de archivo `.json` en el dispositivo
 * 2. Compartir directamente a la app nativa de Google Drive en Android/iOS (Web Share API Level 2)
 * 3. Sincronización directa por API REST de Google Drive (usando Token de Acceso OAuth2 de Google)
 */

import {
  createFullBackupPayload,
  restoreFullBackupPayload,
} from '../db/dexie-db';
import { getLocalDateKey } from '../db/srs-engine';

const DRIVE_BACKUP_FILENAME = 'los-navegantes-tms-backup.json';

/**
 * Genera el archivo de copia de seguridad y lo descarga localmente en el dispositivo
 */
export async function downloadLocalBackupFile(): Promise<string> {
  const payload = await createFullBackupPayload();
  const jsonString = JSON.stringify(payload, null, 2);
  const dateKey = getLocalDateKey();
  const fileName = `los-navegantes-tms-backup-${dateKey}.json`;

  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return fileName;
}

/**
 * Abre el selector nativo de compartir de Android / iOS con el archivo de copia de seguridad
 * para que el usuario pueda elegir "Guardar en Google Drive" con un toque sin configurar claves.
 */
export async function shareBackupToGoogleDriveApp(): Promise<boolean> {
  const payload = await createFullBackupPayload();
  const jsonString = JSON.stringify(payload, null, 2);
  const dateKey = getLocalDateKey();
  const fileName = `los-navegantes-tms-backup-${dateKey}.json`;
  const file = new File([jsonString], fileName, { type: 'application/json' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: 'Copia de Seguridad • Los Navegantes TMS',
      text: `Respaldo de versículos y progreso (${dateKey})`,
      files: [file],
    });
    return true;
  }

  // Fallback si el navegador o WebView no soporta compartir archivos directamente
  await downloadLocalBackupFile();
  return false;
}

/**
 * Sube o actualiza el archivo `los-navegantes-tms-backup.json` directamente en el Google Drive
 * del usuario empleando la API v3 de Google Drive.
 */
export async function uploadBackupToGoogleDriveApi(accessToken: string): Promise<{
  fileId: string;
  modifiedTime: string;
}> {
  const token = accessToken.trim();
  if (!token) {
    throw new Error('Introduce un token de acceso válido de Google Drive.');
  }

  const payload = await createFullBackupPayload();
  const jsonContent = JSON.stringify(payload, null, 2);

  // 1. Buscar si ya existe una copia anterior en Google Drive para actualizarla
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    `name = '${DRIVE_BACKUP_FILENAME}' and trashed = false`
  )}&fields=files(id,name,modifiedTime)&pageSize=1`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!searchRes.ok) {
    throw new Error(
      'No se pudo conectar con Google Drive. Verifica que el token sea válido y tenga permiso drive.file.'
    );
  }

  const searchData = (await searchRes.json()) as {
    files?: { id: string; name: string; modifiedTime: string }[];
  };
  const existingFile = searchData.files?.[0];

  const metadata = {
    name: DRIVE_BACKUP_FILENAME,
    mimeType: 'application/json',
  };

  const boundary = '-------tms_navegantes_backup_boundary';
  const multipartBody =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${jsonContent}\r\n` +
    `--${boundary}--`;

  const uploadUrl = existingFile
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart&fields=id,modifiedTime`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime`;

  const uploadRes = await fetch(uploadUrl, {
    method: existingFile ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!uploadRes.ok) {
    throw new Error('Error al subir la copia de seguridad a Google Drive.');
  }

  const result = (await uploadRes.json()) as { id: string; modifiedTime: string };
  return {
    fileId: result.id,
    modifiedTime: result.modifiedTime || new Date().toISOString(),
  };
}

/**
 * Busca y descarga la última copia `los-navegantes-tms-backup.json` desde Google Drive API
 * y restaura toda la base de datos local.
 */
export async function restoreBackupFromGoogleDriveApi(accessToken: string): Promise<{
  decksCount: number;
  cardsCount: number;
  logsCount: number;
}> {
  const token = accessToken.trim();
  if (!token) {
    throw new Error('Introduce un token de acceso válido de Google Drive.');
  }

  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    `name = '${DRIVE_BACKUP_FILENAME}' and trashed = false`
  )}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime)&pageSize=1`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!searchRes.ok) {
    throw new Error('No se pudo consultar Google Drive. Verifica tu token de acceso.');
  }

  const searchData = (await searchRes.json()) as {
    files?: { id: string; name: string }[];
  };
  const latestFile = searchData.files?.[0];

  if (!latestFile) {
    throw new Error(
      `No se encontró ningún archivo "${DRIVE_BACKUP_FILENAME}" en tu Google Drive.`
    );
  }

  const downloadRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${latestFile.id}?alt=media`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!downloadRes.ok) {
    throw new Error('No se pudo descargar la copia de seguridad desde Google Drive.');
  }

  const rawJson = await downloadRes.text();
  return restoreFullBackupPayload(rawJson);
}
