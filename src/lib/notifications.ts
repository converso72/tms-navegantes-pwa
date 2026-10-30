/**
 * Gestión de Notificaciones Locales de Práctica Diaria (Web Notification API)
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function triggerTestReminderNotification(dailyGoal: number): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  new Notification('Los Navegantes • Hora de Meditar', {
    body: `Guarda la Palabra en tu corazón hoy. Tu meta diaria es de ${dailyGoal} versículos (Cita • Texto • Cita).`,
    icon: '/favicon.svg',
    tag: 'tms-daily-reminder',
  });
}
