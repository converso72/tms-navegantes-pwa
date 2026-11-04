/**
 * Sistema Nativo de Copia de Seguridad Local y en Google Drive para Android (Capacitor) y Web PWA.
 *
 * ¿Por qué fallaba antes en el APK de Android?
 * El WebView de Android dentro de una app nativa Capacitor bloquea las descargas <a download> (`blob:`)
 * y no soporta `navigator.share({ files })` sin permisos nativos.
 *
 * Solución definitiva:
 * Usamos los plugins nativos de Android `@capacitor/filesystem` y `@capacitor/share` para escribir
 * el archivo físico `.json` en el sistema de archivos del teléfono y abrir el Intent nativo de Android
 * (`ACTION_SEND` con `FileProvider`), permitiendo elegir "Guardar en Drive" (Google Drive) o guardarlo
 * directamente en la carpeta Documentos del teléfono.
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import {
  createFullBackupPayload,
  restoreFullBackupPayload,
} from '../db/dexie-db';
import { getLocalDateKey } from '../db/srs-engine';

const DRIVE_BACKUP_FILENAME = 'los-navegantes-tms-backup.json';

/**
 * 1. Guardar copia de seguridad en el almacenamiento LOCAL del dispositivo.
 * - En Android APK: Escribe el archivo físico en `Documents/los-navegantes-tms-backup-YYYY-MM-DD.json`
 *   (y si el sistema restringe Documents en ciertas versiones de Android, ofrece guardarlo con el diálogo del sistema).
 * - En navegador Web: Descarga el archivo `.json`.
 */
export async function downloadLocalBackupFile(): Promise<{
  fileName: string;
  locationLabel: string;
}> {
  const payload = await createFullBackupPayload();
  const jsonString = JSON.stringify(payload, null, 2);
  const dateKey = getLocalDateKey();
  const fileName = `los-navegantes-tms-backup-${dateKey}.json`;

  if (Capacitor.isNativePlatform()) {
    try {
      await Filesystem.writeFile({
        path: fileName,
        data: jsonString,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      return {
        fileName,
        locationLabel: `Carpeta Documentos/${fileName}`,
      };
    } catch {
      // Si Android 11+ bloquea escritura directa en Documents sin permiso previo,
      // escribimos en Cache y abrimos el selector nativo para que el usuario elija carpeta local
      const cached = await Filesystem.writeFile({
        path: fileName,
        data: jsonString,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });
      await Share.share({
        title: 'Guardar Copia de Seguridad Local',
        url: cached.uri,
        dialogTitle: 'Guardar archivo de copia de seguridad',
      });
      return {
        fileName,
        locationLabel: fileName,
      };
    }
  }

  // Fallback para navegador Web (PC / Chrome móvil)
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    fileName,
    locationLabel: `Descargas/${fileName}`,
  };
}

/**
 * 2. Guardar copia de seguridad en GOOGLE DRIVE.
 * - En Android APK: Crea el archivo físico temporal con `@capacitor/filesystem` en `Directory.Cache`
 *   y lanza el Intent nativo de Android (`@capacitor/share`) con el URI del archivo (`content://...`).
 *   Esto abre el panel oficial de Android donde aparece el icono de "Google Drive" ("Guardar en Drive")
 *   con tu cuenta de Google ya iniciada en el móvil.
 */
export async function shareBackupToGoogleDriveApp(): Promise<boolean> {
  const payload = await createFullBackupPayload();
  const jsonString = JSON.stringify(payload, null, 2);
  const dateKey = getLocalDateKey();
  const fileName = `los-navegantes-tms-backup-${dateKey}.json`;

  if (Capacitor.isNativePlatform()) {
    const written = await Filesystem.writeFile({
      path: fileName,
      data: jsonString,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });

    await Share.share({
      title: fileName,
      text: `Copia de seguridad Los Navegantes TMS (${dateKey})`,
      url: written.uri,
      dialogTitle: 'Selecciona "Google Drive" para guardar tu copia',
    });

    return true;
  }

  // En navegador Web que soporte Web Share API de archivos
  const file = new File([jsonString], fileName, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: fileName,
      text: `Copia de seguridad Los Navegantes TMS (${dateKey})`,
      files: [file],
    });
    return true;
  }

  // Si es navegador de escritorio sin menú compartir, descarga el archivo
  await downloadLocalBackupFile();
  return false;
}

/**
 * 3. Recuperar automáticamente desde la carpeta Documentos del teléfono (si se guardó en Local)
 */
export async function restoreLatestLocalBackupFromDocuments(): Promise<{
  decksCount: number;
  cardsCount: number;
  logsCount: number;
  fileName: string;
} | null> {
  if (!Capacitor.isNativePlatform()) return null;

  const dir = await Filesystem.readdir({
    path: '',
    directory: Directory.Documents,
  });

  const backupFiles = dir.files
    .filter((f) => f.name.startsWith('los-navegantes-tms-backup') && f.name.endsWith('.json'))
    .sort((a, b) => b.name.localeCompare(a.name));

  if (backupFiles.length === 0) {
    return null;
  }

  const latest = backupFiles[0];
  const content = await Filesystem.readFile({
    path: latest.name,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
  });

  const rawJson = typeof content.data === 'string' ? content.data : JSON.stringify(content.data);
  const stats = await restoreFullBackupPayload(rawJson);
  return {
    ...stats,
    fileName: latest.name,
  };
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

  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    `name = '${DRIVE_BACKUP_FILENAME}' and trashed = false`
  )}&fields=files(id,name,modifiedTime)&pageSize=1`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!searchRes.ok) {
    throw new Error(
      'No se pudo conectar con Google Drive. Verifica que el token sea válido.'
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
