import React from 'react';
import { Bell, Target, RotateCcw, ShieldCheck, Moon, Sun } from 'lucide-react';
import type { UserSettings } from '../../types/schema';
import {
  requestNotificationPermission,
  triggerTestReminderNotification,
} from '../../lib/notifications';
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

  return (
    <div className="space-y-4">
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
          <span>Base de datos IndexedDB sincronizada 100% Offline (Reina-Valera 1960)</span>
        </div>

        <p className="text-xs text-[#7D746B] dark:text-[#A39A90] leading-relaxed">
          Regla oficial de Los Navegantes: Recita siempre el tema, la cita bíblica antes del texto
          y nuevamente la cita bíblica al finalizar para fijar la dirección exacta en la memoria.
        </p>

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
