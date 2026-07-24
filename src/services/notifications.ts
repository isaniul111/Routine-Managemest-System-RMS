/**
 * Notification Service for Ride & Routine Pro
 */

import { NotificationSetting } from '../utils/helpers';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return await Notification.requestPermission();
}

export function checkNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export function triggerDesktopNotification(title: string, body: string, icon = '/assets/icon.png'): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon,
        badge: icon,
        tag: 'ride-routine-reminder',
      });
    } catch (e) {
      console.warn('Could not launch desktop notification:', e);
    }
  }
}

export function playNotificationChime(): void {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch {
    // Audio context play restriction ignore
  }
}

// Track triggered notifications to avoid duplicates in same minute
const triggeredMap = new Set<string>();

export function scheduleActiveReminders(
  settings: NotificationSetting[],
  onTrigger: (setting: NotificationSetting) => void
): () => void {
  const checkReminders = () => {
    const now = new Date();
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    settings.forEach((s) => {
      if (s.enabled && s.time === currentHHMM) {
        const triggerKey = `${s.id}_${dateStr}_${currentHHMM}`;
        if (!triggeredMap.has(triggerKey)) {
          triggeredMap.add(triggerKey);
          
          // Trigger system notification
          triggerDesktopNotification(
            `Reminder: ${s.title}`,
            `It's ${s.time}! Time for your scheduled ${s.type || 'activity'}.`
          );
          
          // Play notification chime
          playNotificationChime();
          
          // Execute callback
          onTrigger(s);
        }
      }
    });
  };

  // Run initial check
  checkReminders();

  // Check every 5 seconds for pinpoint accuracy
  const interval = setInterval(checkReminders, 5000);

  return () => clearInterval(interval);
}
