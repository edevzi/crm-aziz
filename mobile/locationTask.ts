import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LOCATION_TASK = 'driver-background-location';

function buildApiUrl(serverIp: string, port: string): string {
  if (
    serverIp.includes('.vercel.app') ||
    (serverIp.includes('.') && !/^[0-9.]+$/.test(serverIp))
  ) {
    return `https://${serverIp}/api`;
  }
  const portSuffix = port ? `:${port}` : '';
  return `http://${serverIp}${portSuffix}/api`;
}

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('Background location task error:', error.message);
    return;
  }

  const payload = data as { locations?: Location.LocationObject[] } | undefined;
  const locations = payload?.locations;
  if (!locations?.length) return;

  const latest = locations[locations.length - 1];
  const { latitude, longitude } = latest.coords;

  try {
    const [driverRaw, serverIp, port] = await Promise.all([
      AsyncStorage.getItem('@driver_data'),
      AsyncStorage.getItem('@server_ip'),
      AsyncStorage.getItem('@server_port'),
    ]);

    if (!driverRaw) return;

    const driver = JSON.parse(driverRaw) as { id: number };
    const ip = serverIp || 'crm-aziz.vercel.app';
    const apiUrl = buildApiUrl(ip, port ?? '');

    await fetch(`${apiUrl}/driver/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId: driver.id, latitude, longitude }),
    });
  } catch (e) {
    console.warn('Failed to post background location:', e);
  }
});

export async function hasBackgroundLocationPermission(): Promise<boolean> {
  const bg = await Location.getBackgroundPermissionsAsync();
  return bg.status === 'granted';
}

export async function requestFullLocationAccess(): Promise<{
  foreground: boolean;
  background: boolean;
  canAskAgain: boolean;
}> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') {
    return { foreground: false, background: false, canAskAgain: fg.canAskAgain };
  }

  const bg = await Location.requestBackgroundPermissionsAsync();
  return {
    foreground: true,
    background: bg.status === 'granted',
    canAskAgain: bg.canAskAgain,
  };
}

export async function startBackgroundLocationTracking(): Promise<boolean> {
  const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (started) return true;

  const bg = await Location.getBackgroundPermissionsAsync();
  if (bg.status !== 'granted') return false;

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 10000,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Haydovchi — joylashuv',
      notificationBody: 'Yo\'lda: joylashuvingiz operatorga yuborilmoqda',
      notificationColor: '#4f46e5',
    },
  });
  return true;
}

export async function stopBackgroundLocationTracking(): Promise<void> {
  const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (started) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }
}
