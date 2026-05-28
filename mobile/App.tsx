import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  StatusBar,
  Vibration,
  Platform,
  Animated,
  Linking,
  Pressable,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import {
  Warehouse as LucideWarehouse,
  User as LucideUser,
  Lock as LucideLock,
  LogOut as LucideLogOut,
  Settings as LucideSettings,
  ClipboardList as LucideClipboardList,
  Calendar as LucideCalendar,
  CheckCircle as LucideCheckCircle,
  Phone as LucidePhone,
  RefreshCw as LucideRefreshCw,
  X as LucideX,
  AlertCircle as LucideAlertCircle,
  Navigation as LucideNavigation,
  ChevronRight as LucideChevronRight,
  ChevronLeft as LucideChevronLeft,
  Home as LucideHome,
  Banknote as LucideBanknote,
  CreditCard as LucideCreditCard,
  Smartphone as LucideSmartphone,
  Clock as LucideClock,
  MapPin as LucideMapPin,
} from 'lucide-react-native';
import {
  t,
  Locale,
  TranslationKey,
  getRentalLabel,
  getPaymentLabel,
  getStatusLabel,
  getWeekdayShort,
  formatMonthYear,
  formatCalendarDayTitle,
  formatTimeOnly,
} from './i18n';
import './locationTask';
import {
  requestFullLocationAccess,
  hasBackgroundLocationPermission,
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
} from './locationTask';

const Warehouse = LucideWarehouse as React.ComponentType<{ color?: string; size?: number }>;
const User = LucideUser as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const Lock = LucideLock as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const LogOut = LucideLogOut as React.ComponentType<{ color?: string; size?: number }>;
const Settings = LucideSettings as React.ComponentType<{ color?: string; size?: number }>;
const ClipboardList = LucideClipboardList as React.ComponentType<{ color?: string; size?: number }>;
const Calendar = LucideCalendar as React.ComponentType<{ color?: string; size?: number }>;
const CheckCircle = LucideCheckCircle as React.ComponentType<{ color?: string; size?: number }>;
const Phone = LucidePhone as React.ComponentType<{ color?: string; size?: number }>;
const RefreshCw = LucideRefreshCw as React.ComponentType<{ color?: string; size?: number }>;
const X = LucideX as React.ComponentType<{ color?: string; size?: number }>;
const AlertCircle = LucideAlertCircle as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const Navigation = LucideNavigation as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const ChevronRight = LucideChevronRight as React.ComponentType<{ color?: string; size?: number }>;
const ChevronLeft = LucideChevronLeft as React.ComponentType<{ color?: string; size?: number }>;
const Home = LucideHome as React.ComponentType<{ color?: string; size?: number }>;
const Banknote = LucideBanknote as React.ComponentType<{ color?: string; size?: number }>;
const CreditCard = LucideCreditCard as React.ComponentType<{ color?: string; size?: number }>;
const Smartphone = LucideSmartphone as React.ComponentType<{ color?: string; size?: number }>;
const Clock = LucideClock as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const MapPin = LucideMapPin as React.ComponentType<{ color?: string; size?: number; style?: object }>;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync(locale: Locale) {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        console.warn('Project ID not found in app.json');
      }
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log('Expo Push Token:', token);
    } catch (e) {
      console.error(e);
    }
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  return token;
}

const WORKFLOW_RANK: Record<string, number> = {
  new: 0,
  assigned: 1,
  in_progress: 2,
  container_placed: 3,
  picked_up: 4,
};

const WORKING_STATUSES = new Set(['assigned', 'in_progress', 'container_placed', 'picked_up']);

function getWorkflowRank(status: string): number {
  return WORKFLOW_RANK[status] ?? -1;
}

const PaymentTypeIcon = ({ type, size = 16, color = '#64748b' }: { type: string, size?: number, color?: string }) => {
  if (type === 'cash') return <Banknote size={size} color={color} />;
  if (type === 'card') return <CreditCard size={size} color={color} />;
  if (type === 'online') return <Smartphone size={size} color={color} />;
  return null;
};

function filterActiveOrders(list: Order[]): Order[] {
  return list.filter(o => o.status !== 'completed');
}

/** Focus = order driver is executing (highest workflow stage, then earliest schedule). */
function computeFocusOrder(list: Order[]): Order | null {
  const active = filterActiveOrders(list);
  if (active.length === 0) return null;

  const working = active.filter(o => WORKING_STATUSES.has(o.status));
  const pool = working.length > 0 ? working : active;

  return [...pool].sort((a, b) => {
    const rankDiff = getWorkflowRank(b.status) - getWorkflowRank(a.status);
    if (rankDiff !== 0) return rankDiff;
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
  })[0];
}

function formatAddressDisplay(address: string, locale: string): string {
  if (!address) return '';
  const lower = address.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    if (lower.includes('yandex')) return 'Ссылка Яндекс Карты (URL)';
    if (lower.includes('google')) return 'Ссылка Google Карты (URL)';
    return 'Ссылка на карту (URL)';
  }
  return address;
}

function sortQueueOrders(list: Order[], focusId: number | null): Order[] {
  return filterActiveOrders(list)
    .filter(o => o.id !== focusId)
    .sort((a, b) => {
      const aWorking = WORKING_STATUSES.has(a.status) ? 0 : 1;
      const bWorking = WORKING_STATUSES.has(b.status) ? 0 : 1;
      if (aWorking !== bWorking) return aWorking - bWorking;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });
}

/** After accept (assigned+), other orders are queue-only until focus completes */
function hasBlockingWorkflow(focus: Order | null): boolean {
  return focus != null && focus.status !== 'new';
}

function canRunWorkflowOnOrder(order: Order, focus: Order | null): boolean {
  if (!focus || focus.id === order.id) return true;
  if (!hasBlockingWorkflow(focus)) return true;
  return false;
}

function queueActionMode(order: Order, focus: Order | null): 'full' | 'accept_only' | 'locked' {
  if (!focus || focus.id === order.id) return 'full';
  if (order.status === 'new') return 'accept_only';
  if (hasBlockingWorkflow(focus)) return 'locked';
  return 'full';
}

type Order = {
  id: number;
  status: string;
  address: string;
  mapUrl?: string | null;
  scheduledAt: string;
  paymentAmount: number;
  paymentType: string;
  paymentStatus: string;
  clientName: string;
  clientPhone: string;
  containerSizeM3: number;
  containerNumber?: string | null;
  rentalDuration: string;
  operatorNote?: string;
  updatedAt: string;
};

function startOfDay(d: Date): Date {
  const local = new Date(d);
  local.setHours(0, 0, 0, 0);
  return local;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

/** Bump when DB seed resets driver IDs — forces mobile re-login */
const SESSION_VERSION = '3';

const STEP_KEYS: TranslationKey[] = ['stepAccept', 'stepOnWay', 'stepContainer', 'stepPayment'];

function getStepIndex(status: string): number {
  switch (status) {
    case 'new': return 1;
    case 'assigned': return 2;
    case 'in_progress': return 3;
    case 'container_placed': return 3;
    case 'picked_up': return 4;
    case 'completed': return 5;
    default: return 0;
  }
}

function getPrimaryButtonKey(status: string): TranslationKey | null {
  switch (status) {
    case 'new': return 'btnAccept';
    case 'assigned': return 'btnStart';
    case 'in_progress': return 'btnDrop';
    case 'container_placed': return 'btnPickup';
    default: return null;
  }
}

function getPrimaryActionColor(status: string): string {
  switch (status) {
    case 'new': return '#2563eb';
    case 'assigned': return '#d97706';
    case 'in_progress': return '#ea580c';
    case 'container_placed': return '#0d9488';
    case 'picked_up': return '#059669';
    default: return '#4f46e5';
  }
}

function getNextStatus(status: string): string | null {
  switch (status) {
    case 'new': return 'assigned';
    case 'assigned': return 'in_progress';
    case 'in_progress': return 'container_placed';
    case 'container_placed': return 'picked_up';
    default: return null;
  }
}

function AlertModal({
  visible,
  title,
  message,
  onClose,
  locale,
  onOpenSettings,
}: {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  locale: Locale;
  onOpenSettings?: () => void;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.alertOverlay}>
        <View style={styles.alertBox}>
          <AlertCircle size={48} color="#4f46e5" style={{ marginBottom: 16 }} />
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
          {onOpenSettings ? (
            <TouchableOpacity
              style={[styles.alertBtn, { marginBottom: 10 }]}
              onPress={() => { onOpenSettings(); onClose(); }}
            >
              <Text style={styles.alertBtnText}>{t(locale, 'openSettings')}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={[styles.alertBtn, onOpenSettings && styles.alertBtnSecondary]} onPress={onClose}>
            <Text style={[styles.alertBtnText, onOpenSettings && styles.alertBtnTextSecondary]}>{t(locale, 'understood')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function AppInner() {
  const insets = useSafeAreaInsets();

  const [serverIp, setServerIp] = useState('crm-aziz.vercel.app');
  const [port, setPort] = useState('');
  const locale: Locale = 'ru';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [driver, setDriver] = useState<{ id: number; name: string; vehiclePlate: string } | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'calendar'>('home');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [navModalOrder, setNavModalOrder] = useState<Order | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(startOfDay(new Date()));
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  /** Stays on current job until completed — accepting another order does not switch hero card */
  const [pinnedFocusId, setPinnedFocusId] = useState<number | null>(null);
  const [expandedHistoryDates, setExpandedHistoryDates] = useState<Set<string>>(new Set());

  const knownOrderIds = useRef<Set<number>>(new Set());
  const initialFetchDone = useRef(false);
  const calendarScrollRef = useRef<ScrollView>(null);
  const CALENDAR_PAST_DAYS = 14;
  const CALENDAR_FUTURE_DAYS = 28;
  const CALENDAR_DAY_WIDTH = 58;
  const CALENDAR_DAY_GAP = 8;

  const [isTrackingGps, setIsTrackingGps] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    openSettings?: boolean;
  }>({ visible: false, title: '', message: '' });

  const showAlert = useCallback((title: string, message: string, openSettings = false) => {
    setCustomAlert({ visible: true, title, message, openSettings });
  }, []);

  const getApiUrl = useCallback(() => {
    if (serverIp.includes('.vercel.app') || (serverIp.includes('.') && !/^[0-9.]+$/.test(serverIp))) {
      return `https://${serverIp}/api`;
    }
    const portSuffix = port ? `:${port}` : '';
    return `http://${serverIp}${portSuffix}/api`;
  }, [serverIp, port]);

  const formatDate = useCallback((dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;

      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  }, []);

  const formatDateShort = useCallback((d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
  }, []);

  const clearSession = useCallback(async () => {
    setIsLoggedIn(false);
    setDriver(null);
    setOrders([]);
    knownOrderIds.current = new Set();
    initialFetchDone.current = false;
    await AsyncStorage.multiRemove(['@driver_data', '@session_version']);
  }, []);

  const validateDriverSession = useCallback(
    async (driverId: number, apiUrl: string): Promise<boolean | null> => {
      try {
        const res = await fetch(`${apiUrl}/driver/validate?driverId=${driverId}&t=${Date.now()}`);
        if (res.status === 404) return true;
        const data = await res.json();
        return res.ok && data.valid === true;
      } catch {
        return null;
      }
    },
    []
  );

  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const savedIp = await AsyncStorage.getItem('@server_ip');
        const savedPort = await AsyncStorage.getItem('@server_port');
        const savedDriver = await AsyncStorage.getItem('@driver_data');
        const savedSessionVersion = await AsyncStorage.getItem('@session_version');

        if (savedIp !== null) setServerIp(savedIp);
        if (savedPort !== null) setPort(savedPort);

        if (savedSessionVersion !== SESSION_VERSION) {
          await clearSession();
          if (savedDriver !== null) {
            showAlert(t(locale, 'sessionExpired'), t(locale, 'sessionExpiredMessage'));
          }
          return;
        }

        if (savedDriver !== null) {
          const parsed = JSON.parse(savedDriver) as { id: number; name: string; vehiclePlate: string };
          const apiBase =
            (savedIp ?? 'crm-aziz.vercel.app').includes('.vercel.app') ||
              ((savedIp ?? '').includes('.') && !/^[0-9.]+$/.test(savedIp ?? ''))
              ? `https://${savedIp ?? 'crm-aziz.vercel.app'}/api`
              : `http://${savedIp ?? 'crm-aziz.vercel.app'}${savedPort ? `:${savedPort}` : ''}/api`;

          const valid = await validateDriverSession(parsed.id, apiBase);
          if (valid === false) {
            await clearSession();
            showAlert(t(locale, 'sessionExpired'), t(locale, 'sessionExpiredMessage'));
            return;
          }
          setDriver(parsed);
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error('Failed to load persisted app states:', e);
      }
    };
    loadPersistedData();
  }, [clearSession, validateDriverSession, showAlert]);



  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    if (isTrackingGps) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
        ])
      );
      anim.start();
    } else {
      pulseAnim.setValue(0.4);
    }
    return () => { if (anim) anim.stop(); };
  }, [isTrackingGps, pulseAnim]);

  const postLocation = useCallback(
    async (latitude: number, longitude: number) => {
      if (!driver) return;
      try {
        await fetch(`${getApiUrl()}/driver/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ driverId: driver.id, latitude, longitude }),
        });
      } catch {
        /* retry on next tick */
      }
    },
    [driver, getApiUrl]
  );

  const savePushToken = useCallback(async (driverId: number, token: string, apiUrl: string) => {
    try {
      await fetch(`${apiUrl}/driver/push-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, expoPushToken: token }),
      });
    } catch (error) {
      console.error('Failed to save push token:', error);
    }
  }, []);

  const isActiveTransit = orders.some(o => o.status === 'in_progress' || o.status === 'picked_up');

  useEffect(() => {
    let active = true;

    const startTracking = async () => {
      if (!isLoggedIn || !driver) {
        if (locationSubscription.current) {
          locationSubscription.current.remove();
          locationSubscription.current = null;
        }
        await stopBackgroundLocationTracking();
        setIsTrackingGps(false);
        return;
      }

      const fg = await Location.getForegroundPermissionsAsync();
      if (fg.status !== 'granted') {
        showAlert(t(locale, 'gpsPermissionTitle'), t(locale, 'gpsPermissionMessage'), true);
        return;
      }

      const bgGranted = await hasBackgroundLocationPermission();
      if (bgGranted) {
        try {
          const started = await startBackgroundLocationTracking();
          if (started && active) {
            if (locationSubscription.current) {
              locationSubscription.current.remove();
              locationSubscription.current = null;
            }
            setIsTrackingGps(true);
            return;
          }
        } catch (e) {
          console.log('Background location start failed:', e);
        }
      } else {
        const { foreground, background, canAskAgain } = await requestFullLocationAccess();
        if (background) {
          try {
            const started = await startBackgroundLocationTracking();
            if (started && active) {
              setIsTrackingGps(true);
              return;
            }
          } catch (e) { }
        } else if (canAskAgain) {
          showAlert(t(locale, 'gpsAlwaysTitle'), t(locale, 'gpsAlwaysMessage'), true);
        }
      }

      if (!locationSubscription.current && active) {
        setIsTrackingGps(true);
        try {
          locationSubscription.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Balanced, timeInterval: 10000 },
            (loc) => postLocation(loc.coords.latitude, loc.coords.longitude)
          );
        } catch {
          setIsTrackingGps(false);
        }
      }
    };

    startTracking();

    return () => {
      active = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, [isLoggedIn, driver, locale, showAlert, postLocation]);

  useEffect(() => {
    if (isLoggedIn && driver) {
      const setupPush = async () => {
        const token = await registerForPushNotificationsAsync(locale);
        if (token) {
          await savePushToken(driver.id, token, getApiUrl());
        }
      };
      setupPush();

      const subscription = Notifications.addNotificationResponseReceivedListener(response => {
        // Handle notification tap
        console.log("Notification tapped:", response);
      });
      return () => subscription.remove();
    }
  }, [isLoggedIn, driver, locale, getApiUrl, savePushToken]);

  const handleLogin = async () => {
    if (!username || !password) {
      showAlert(t(locale, 'loginError'), t(locale, 'enterCredentials'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/driver/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t(locale, 'loginError'));

      setDriver(data);
      setIsLoggedIn(true);
      knownOrderIds.current = new Set();
      initialFetchDone.current = false;
      await AsyncStorage.setItem('@driver_data', JSON.stringify(data));
      await AsyncStorage.setItem('@session_version', SESSION_VERSION);


      const perms = await requestFullLocationAccess();
      if (!perms.foreground) {
        showAlert(t(locale, 'gpsPermissionTitle'), t(locale, 'gpsPermissionMessage'), true);
      } else if (!perms.background) {
        showAlert(t(locale, 'gpsAlwaysTitle'), t(locale, 'gpsAlwaysMessage'), true);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : t(locale, 'connectionError');
      showAlert(t(locale, 'loginError'), msg);
    } finally {
      setLoading(false);
    }
  };

  const detectNewOrders = useCallback((data: Order[]) => {
    const activeStatuses = new Set(['new', 'assigned']);
    const newAssignments = data.filter(
      o => activeStatuses.has(o.status) && !knownOrderIds.current.has(o.id)
    );

    if (initialFetchDone.current && newAssignments.length > 0) {
      Vibration.vibrate([0, 500, 200, 500]);
      showAlert(t(locale, 'newOrderTitle'), t(locale, 'newOrderMessage'));
    }

    knownOrderIds.current = new Set(data.map(o => o.id));
    initialFetchDone.current = true;
  }, [locale, showAlert]);

  const fetchOrders = useCallback(async (showIndicator = true) => {
    if (!driver) return;
    if (showIndicator) setLoading(true);

    try {
      const response = await fetch(`${getApiUrl()}/driver/orders?driverId=${driver.id}&t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'Expires': '0' },
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || t(locale, 'loadError'));

      if (!Array.isArray(data)) {
        throw new Error(t(locale, 'loadError'));
      }

      if (data.length === 0) {
        const valid = await validateDriverSession(driver.id, getApiUrl());
        if (valid === false) {
          await clearSession();
          showAlert(t(locale, 'sessionExpired'), t(locale, 'sessionExpiredMessage'));
          return;
        }
      }

      setOrders(data);
      detectNewOrders(data);
    } catch (error: unknown) {
      console.error(error);
      showAlert(t(locale, 'loginError'), t(locale, 'loadErrorRetry'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [driver, getApiUrl, locale, detectNewOrders, validateDriverSession, clearSession, showAlert]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(false);
  };

  useEffect(() => {
    if (isLoggedIn && driver) {
      fetchOrders();
      const interval = setInterval(() => fetchOrders(false), 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, driver, fetchOrders]);

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    if (updatingOrderId !== null) return;
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(`${getApiUrl()}/driver/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error(t(locale, 'statusUpdateError'));

      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => (prev ? { ...prev, status: newStatus } : null));
      }

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : t(locale, 'statusUpdateError');
      showAlert(t(locale, 'loginError'), msg);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCompleteOrder = async (orderId: number, payType: string) => {
    if (updatingOrderId !== null) return;
    const order = orders.find(o => o.id === orderId);
    if (order && !canRunWorkflowOnOrder(order, focusOrder)) {
      showAlert(t(locale, 'lockedAction'), t(locale, 'finishCurrentFirst'));
      return;
    }

    Alert.alert(
      "Фото-отчет",
      "Пожалуйста, прикрепите фото (например, чек или установленный контейнер) для завершения заказа.",
      [
        {
          text: "Сделать фото",
          onPress: () => promptPhotoCapture(orderId, payType)
        },
        {
          text: "Пропустить",
          style: "cancel",
          onPress: () => completeOrderWithPhoto(orderId, payType, null)
        }
      ]
    );
  };

  const promptPhotoCapture = async (orderId: number, payType: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert("Ошибка", "Нет доступа к камере");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        if (manipResult.base64) {
          const base64Img = `data:image/jpeg;base64,${manipResult.base64}`;
          completeOrderWithPhoto(orderId, payType, base64Img);
        } else {
          completeOrderWithPhoto(orderId, payType, null);
        }
      } catch (err) {
        console.error('Image compression failed:', err);
        completeOrderWithPhoto(orderId, payType, null);
      }
    }
  };

  const completeOrderWithPhoto = async (orderId: number, payType: string, photoBase64: string | null) => {
    setUpdatingOrderId(orderId);
    try {
      const payload: any = {
        status: 'completed',
        paymentType: payType,
        paymentStatus: 'received',
      };
      if (photoBase64) {
        payload.photoUrl = photoBase64;
      }

      const response = await fetch(`${getApiUrl()}/driver/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(t(locale, 'completeError'));

      setOrders(prev =>
        prev.map(o =>
          o.id === orderId
            ? { ...o, status: 'completed', paymentType: payType, paymentStatus: 'received' }
            : o
        )
      );

      setSelectedOrder(null);
      if (pinnedFocusId === orderId) setPinnedFocusId(null);

      showAlert(t(locale, 'orderCompletedTitle'), t(locale, 'orderCompletedMessage'));
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : t(locale, 'completeError');
      showAlert(t(locale, 'loginError'), msg);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const callClient = (phone: string) => {
    const tel = phone.replace(/\s/g, '');
    Linking.openURL(`tel:${tel}`).catch(() => {
      showAlert(t(locale, 'call'), phone);
    });
  };

  const openNavigation = (order: Order) => {
    setNavModalOrder(order);
  };

  function extractCoordinates(text: string): { lat: string, lon: string } | null {
    if (!text) return null;
    const ptMatch = text.match(/(?:pt|ll|whatshere%5Bpoint%5D|whatshere\[point\])=([\-0-9.]+)(?:,|%2C)([\-0-9.]+)/);
    if (ptMatch) return { lon: ptMatch[1], lat: ptMatch[2] };
    const googleMatch = text.match(/@([\-0-9.]+)(?:,|%2C)([\-0-9.]+)/);
    if (googleMatch) return { lat: googleMatch[1], lon: googleMatch[2] };
    const qMatch = text.match(/(?:query|q)=([\-0-9.]+)(?:,|%2C)([\-0-9.]+)/);
    if (qMatch) return { lat: qMatch[1], lon: qMatch[2] };
    return null;
  }

  const openMapApp = (app: 'yandex' | 'google', order: Order) => {
    setNavModalOrder(null);
    let lat: string | null = null;
    let lon: string | null = null;

    const coords = extractCoordinates(order.mapUrl || '') || extractCoordinates(order.address || '');
    if (coords) {
      lat = coords.lat;
      lon = coords.lon;
    }

    if (app === 'yandex') {
      if (lat && lon) {
        Linking.openURL(`yandexnavi://build_route_on_map?lat_to=${lat}&lon_to=${lon}`).catch(() => {
          Linking.openURL(`yandexmaps://build_route_on_map?lat_to=${lat}&lon_to=${lon}`).catch(() => {
            Linking.openURL(`https://yandex.ru/maps/?pt=${lon},${lat}&z=18`);
          });
        });
      } else if (order.mapUrl && order.mapUrl.startsWith('http')) {
        Linking.openURL(order.mapUrl);
      } else if (order.address && order.address.startsWith('http')) {
        Linking.openURL(order.address);
      } else {
        Linking.openURL(`yandexnavi://build_route_on_map?text=${encodeURIComponent(order.address)}`).catch(() => {
          Linking.openURL(`https://yandex.ru/maps/?text=${encodeURIComponent(order.address)}`);
        });
      }
    } else if (app === 'google') {
      if (lat && lon) {
        Linking.openURL(`google.navigation:q=${lat},${lon}`).catch(() => {
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`);
        });
      } else if (order.mapUrl && order.mapUrl.startsWith('http')) {
        Linking.openURL(order.mapUrl);
      } else if (order.address && order.address.startsWith('http')) {
        Linking.openURL(order.address);
      } else {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`);
      }
    }
  };

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const base = startOfDay(new Date());
    for (let i = -CALENDAR_PAST_DAYS; i <= CALENDAR_FUTURE_DAYS; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const calendarDayIndex = useCallback((day: Date) => {
    const base = startOfDay(new Date());
    return Math.round((startOfDay(day).getTime() - base.getTime()) / 86400000) + CALENDAR_PAST_DAYS;
  }, []);

  const scrollCalendarToDay = useCallback(
    (day: Date) => {
      requestAnimationFrame(() => {
        const idx = calendarDayIndex(day);
        calendarScrollRef.current?.scrollTo({
          x: Math.max(0, idx * (CALENDAR_DAY_WIDTH + CALENDAR_DAY_GAP) - 56),
          animated: true,
        });
      });
    },
    [calendarDayIndex]
  );

  const scrollCalendarToToday = useCallback(() => {
    scrollCalendarToDay(new Date());
  }, [scrollCalendarToDay]);

  const goToCalendarToday = useCallback(() => {

    const today = startOfDay(new Date());
    setSelectedCalendarDate(today);
    scrollCalendarToToday();
  }, [scrollCalendarToToday]);

  const shiftCalendarWeek = useCallback(
    (deltaWeeks: number) => {
      const next = new Date(selectedCalendarDate);
      next.setDate(next.getDate() + deltaWeeks * 7);
      const min = calendarDays[0];
      const max = calendarDays[calendarDays.length - 1];
      const clamped = startOfDay(next < min ? min : next > max ? max : next);

      setSelectedCalendarDate(clamped);
      scrollCalendarToDay(clamped);
    },
    [selectedCalendarDate, calendarDays, scrollCalendarToDay]
  );

  useEffect(() => {
    if (activeTab === 'calendar') {
      setSelectedCalendarDate(startOfDay(new Date()));
      scrollCalendarToToday();
    }
  }, [activeTab, scrollCalendarToToday]);

  const getDayLabel = (d: Date) => {
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (isSameDay(d, today)) return t(locale, 'today');
    if (isSameDay(d, tomorrow)) return t(locale, 'tomorrow');
    return formatDateShort(d);
  };

  const ordersForCalendarDay = useMemo(() => {
    const dayOrders = orders.filter(o => isSameDay(new Date(o.scheduledAt), selectedCalendarDate));
    const active = dayOrders.filter(o => o.status !== 'completed');
    const done = dayOrders.filter(o => o.status === 'completed');
    const byTime = (a: Order, b: Order) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    return [...active.sort(byTime), ...done.sort(byTime)];
  }, [orders, selectedCalendarDate]);

  const calendarDayStats = useMemo(() => {
    const active = ordersForCalendarDay.filter(o => o.status !== 'completed').length;
    const done = ordersForCalendarDay.filter(o => o.status === 'completed').length;
    return { active, done, total: ordersForCalendarDay.length };
  }, [ordersForCalendarDay]);

  const activeOrders = useMemo(() => filterActiveOrders(orders), [orders]);
  const computedFocusOrder = useMemo(() => computeFocusOrder(orders), [orders]);

  const focusOrder = useMemo(() => {
    if (pinnedFocusId != null) {
      const pinned = activeOrders.find(o => o.id === pinnedFocusId);
      if (pinned) return pinned;
    }
    return computedFocusOrder;
  }, [activeOrders, computedFocusOrder, pinnedFocusId]);

  useEffect(() => {
    if (pinnedFocusId != null && !activeOrders.some(o => o.id === pinnedFocusId)) {
      setPinnedFocusId(null);
    }
  }, [activeOrders, pinnedFocusId]);

  useEffect(() => {
    if (pinnedFocusId == null && computedFocusOrder) {
      setPinnedFocusId(computedFocusOrder.id);
    }
  }, [computedFocusOrder, pinnedFocusId]);

  const otherActiveOrders = useMemo(
    () => sortQueueOrders(orders, focusOrder?.id ?? null),
    [orders, focusOrder]
  );

  const historyOrders = useMemo(
    () => orders.filter(o => o.status === 'completed'),
    [orders]
  );

  const todayEarned = useMemo(() => {
    return historyOrders
      .filter(o => isSameDay(new Date(o.scheduledAt), startOfDay(new Date())))
      .reduce((sum, o) => sum + (Number(o.paymentAmount) || 0), 0);
  }, [historyOrders]);

  const groupedHistory = useMemo(() => {
    const groups: { dateStr: string; dateObj: Date; orders: Order[]; totalAmount: number }[] = [];
    const sorted = [...historyOrders].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
    sorted.forEach(o => {
      const d = new Date(o.scheduledAt);
      const dateStr = formatCalendarDayTitle(locale, d);
      let g = groups.find(x => x.dateStr === dateStr);
      if (!g) {
        g = { dateStr, dateObj: startOfDay(new Date(o.scheduledAt)), orders: [], totalAmount: 0 };
        groups.push(g);
      }
      g.orders.push(o);
      g.totalAmount += Number(o.paymentAmount) || 0;
    });
    return groups;
  }, [historyOrders, locale]);

  const openOrder = (order: Order) => {

    setShowOrderDetails(false);
    setSelectedOrder(order);
  };

  const runPrimaryAction = (order: Order) => {
    const next = getNextStatus(order.status);
    if (!next || updatingOrderId !== null) return;

    const mode = queueActionMode(order, focusOrder);
    if (mode === 'locked') {
      showAlert(t(locale, 'lockedAction'), t(locale, 'finishCurrentFirst'));
      return;
    }
    if (mode === 'accept_only' && next !== 'assigned') {
      showAlert(t(locale, 'lockedAction'), t(locale, 'finishCurrentFirst'));
      return;
    }
    if (!canRunWorkflowOnOrder(order, focusOrder) && next !== 'assigned') {
      showAlert(t(locale, 'lockedAction'), t(locale, 'finishCurrentFirst'));
      return;
    }

    if (pinnedFocusId == null) {
      setPinnedFocusId(order.id);
    }

    handleUpdateStatus(order.id, next);
  };

  const renderStepProgress = (status: string) => {
    const current = getStepIndex(status);
    return (
      <View style={styles.stepRow}>
        {STEP_KEYS.map((key, i) => {
          const stepNum = i + 1;
          const done = stepNum < current;
          const active = stepNum === current;
          return (
            <View key={key} style={styles.stepItem}>
              <View style={[styles.stepDot, done && styles.stepDotDone, active && styles.stepDotActive]}>
                {done ? <CheckCircle size={14} color="#fff" /> : <Text style={[styles.stepDotNum, active && styles.stepDotNumActive]}>{stepNum}</Text>}
              </View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]} numberOfLines={1}>{t(locale, key)}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  // Payment options are defined by the operator. Driver just confirms.

  const renderPrimaryButton = (order: Order, large = false) => {
    const btnKey = getPrimaryButtonKey(order.status);
    const isUpdating = updatingOrderId === order.id;
    const btnStyle = large ? styles.heroBtn : styles.quickActionBtn;
    const txtStyle = large ? styles.heroBtnText : styles.quickActionText;
    const mode = queueActionMode(order, focusOrder);

    if (order.status === 'picked_up') {
      if (mode === 'locked') {
        return (
          <View style={[large ? styles.heroPayBlock : styles.compactPayRow, styles.lockedBlock]}>
            <Text style={styles.lockedHint}>{t(locale, 'finishCurrentFirst')}</Text>
          </View>
        );
      }

      const isBeznal = order.paymentType === 'card' || order.paymentType === 'online';

      if (isBeznal) {
        return (
          <View style={large ? styles.heroPayBlock : styles.compactPayRow}>
            <View style={{ backgroundColor: '#10b981', padding: 8, borderRadius: 8, marginBottom: large ? 12 : 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ marginRight: 6 }}>
                <CheckCircle size={18} color="#fff" />
              </View>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t(locale, 'paidBeznal')}</Text>
            </View>
            <TouchableOpacity
              style={[large ? styles.heroBtn : styles.quickActionBtn, { backgroundColor: '#059669' }, isUpdating && styles.btnDisabled]}
              disabled={isUpdating}
              onPress={() => handleCompleteOrder(order.id, order.paymentType)}
              activeOpacity={0.85}
            >
              {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={large ? styles.heroBtnText : styles.quickActionText}>{t(locale, 'btnComplete')}</Text>}
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <View style={large ? styles.heroPayBlock : styles.compactPayRow}>
          <Text style={styles.payHint}>{t(locale, 'waitingPayment')}</Text>
          <TouchableOpacity
            style={[large ? styles.heroBtn : styles.quickActionBtn, { backgroundColor: '#059669', flexDirection: 'row', gap: 8, justifyContent: 'center' }, isUpdating && styles.btnDisabled]}
            disabled={isUpdating}
            onPress={() => handleCompleteOrder(order.id, order.paymentType)}
            activeOpacity={0.85}
          >
            <Banknote size={20} color="#fff" />
            <Text style={large ? styles.heroBtnText : styles.quickActionText}>Получил наличные</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (mode === 'locked') {
      return (
        <View style={[btnStyle, styles.lockedBtn]}>
          <Text style={styles.lockedBtnText}>{t(locale, 'lockedAction')}</Text>
        </View>
      );
    }

    if (mode === 'accept_only' && order.status !== 'new') {
      return (
        <View style={[btnStyle, styles.lockedBtn]}>
          <Text style={styles.lockedBtnText}>{t(locale, 'lockedAction')}</Text>
        </View>
      );
    }

    if (!btnKey) return null;

    return (
      <TouchableOpacity
        style={[btnStyle, { backgroundColor: getPrimaryActionColor(order.status) }, isUpdating && styles.btnDisabled]}
        disabled={isUpdating}
        onPress={() => runPrimaryAction(order)}
        activeOpacity={0.8}
      >
        {isUpdating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={txtStyle}>{t(locale, btnKey)}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderStatusBadge = (status: string, compact = false) => {
    const { label, color, bg } = getStatusLabel(locale, status);
    return (
      <View style={[styles.statusBadge, { backgroundColor: bg }, compact && styles.statusBadgeCompact]}>
        <Text style={[styles.statusBadgeText, { color }, compact && styles.statusBadgeTextCompact]}>{label}</Text>
      </View>
    );
  };

  const renderCompactCard = (order: Order, queueIndex?: number, inCalendar = false) => {
    const scheduledFull = formatDate(order.scheduledAt);
    const timeOnly = scheduledFull.split(' ')[1] || scheduledFull;
    const btnKey = getPrimaryButtonKey(order.status);
    const isPayment = order.status === 'picked_up';
    const mode = queueActionMode(order, focusOrder);
    const showAction = btnKey || isPayment;
    const isFocus = focusOrder?.id === order.id;

    return (
      <View key={order.id} style={[styles.orderCard, isFocus && styles.orderCardFocus]}>
        <TouchableOpacity style={styles.orderCardTap} onPress={() => openOrder(order)} activeOpacity={0.85}>
          <View style={styles.orderCardBody}>
            <View style={styles.orderCardTop}>
              <Text style={styles.orderQueue}>
                {queueIndex != null ? `${t(locale, 'queueNext')} #${queueIndex}` : `#${order.id}`}
              </Text>
              {renderStatusBadge(order.status, true)}
            </View>
            <View style={styles.orderTimeRow}>
              <Clock size={14} color="#64748b" style={{ marginRight: 4 }} />
              <Text style={styles.orderTime}>{inCalendar ? scheduledFull : timeOnly}</Text>
            </View>
            <View style={styles.orderAddressRow}>
              <MapPin size={14} color="#94a3b8" style={{ marginTop: 2, marginRight: 4 }} />
              <Text style={styles.orderAddress} numberOfLines={2}>{formatAddressDisplay(order.address, locale)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={styles.orderMeta}>{order.clientName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <PaymentTypeIcon type={order.paymentType} size={14} color="#475569" />
                <Text style={{ fontSize: 12, color: '#475569', fontWeight: '500' }}>
                  {getPaymentLabel(locale, order.paymentType)}: {(order.paymentAmount || 0).toLocaleString()} {t(locale, 'currency')}
                </Text>
              </View>
            </View>
          </View>
          <ChevronRight size={20} color="#cbd5e1" />
        </TouchableOpacity>
        
        {order.status === 'container_placed' && (
          <View style={{ paddingHorizontal: 12 }}>
            <ContainerTimer updatedAt={order.updatedAt} />
          </View>
        )}

        {showAction && order.status !== 'completed' && (
          <View style={styles.orderCardAction}>
            {isPayment && mode === 'locked' ? (
              <View style={[styles.quickActionBtn, styles.lockedBtn]}>
                <Text style={styles.lockedBtnText}>{t(locale, 'lockedAction')}</Text>
              </View>
            ) : isPayment ? (
              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: '#059669' }]}
                onPress={() => openOrder(order)}
              >
                <Text style={styles.quickActionText}>{t(locale, 'stepPayment')}</Text>
              </TouchableOpacity>
            ) : (
              renderPrimaryButton(order, false)
            )}
          </View>
        )}
      </View>
    );
  };

  const ContainerTimer = ({ updatedAt }: { updatedAt?: string }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
      const update = () => {
        if (!updatedAt) {
          setElapsed(0);
          return;
        }
        const start = new Date(updatedAt).getTime();
        const now = new Date().getTime();
        if (!isNaN(start)) {
          setElapsed(Math.max(0, now - start));
        }
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }, [updatedAt]);

    const totalSeconds = Math.floor(elapsed / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const isLate = hours >= 2;
    const color = isLate ? '#ef4444' : '#f59e0b';
    const bgColor = isLate ? '#fee2e2' : '#fef3c7';
    
    const hStr = String(hours).padStart(2, '0');
    const mStr = String(minutes).padStart(2, '0');
    const sStr = String(seconds).padStart(2, '0');

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: bgColor, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 10, marginBottom: 12, alignSelf: 'flex-start' }}>
        <Clock size={16} color={color} style={{ marginRight: 6 }} />
        <Text style={{ fontSize: 16, fontWeight: '700', color: color }}>
          {hStr}:{mStr}:{sStr} {isLate ? '(Опоздание)' : ''}
        </Text>
      </View>
    );
  };

  const renderHeroCard = (order: Order) => {
    const scheduledFull = formatDate(order.scheduledAt);
    const timeOnly = scheduledFull.split(' ')[1] || scheduledFull;
    const datePart = scheduledFull.split(' ')[0] || scheduledFull;
    const btnKey = getPrimaryButtonKey(order.status);
    return (
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroLabel}>{t(locale, 'currentOrder')}</Text>
          {renderStatusBadge(order.status)}
        </View>
        {renderStepProgress(order.status)}
        <View style={styles.heroScheduleBlock}>
          <Text style={styles.heroScheduleLabel}>{t(locale, 'scheduledAt')}</Text>
          <Text style={styles.heroTime}>{timeOnly}</Text>
          <Text style={styles.heroDateSub}>{datePart}</Text>
        </View>
        <Text style={styles.heroAddress}>{formatAddressDisplay(order.address, locale)}</Text>
        <TouchableOpacity style={styles.heroNavBtn} onPress={() => openNavigation(order)} activeOpacity={0.8}>
          <Navigation size={16} color="#fff" />
          <Text style={styles.heroNavBtnText}>
            Навигация
          </Text>
        </TouchableOpacity>
        {order.status === 'container_placed' && (
          <ContainerTimer updatedAt={order.updatedAt} />
        )}
        <View style={styles.heroTimeRow}>
          <Clock size={16} color="#64748b" style={{ marginRight: 6 }} />
          <Text style={styles.heroTime}>{timeOnly}</Text>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1', marginHorizontal: 8 }} />
          <Text style={styles.heroClient}>{order.clientName}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, backgroundColor: '#f1f5f9', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
          <PaymentTypeIcon type={order.paymentType} size={16} color="#475569" />
          <Text style={{ fontSize: 13, color: '#475569', fontWeight: '600' }}>{getPaymentLabel(locale, order.paymentType)}: {order.paymentAmount.toLocaleString()} {t(locale, 'currency')}</Text>
        </View>
        <View style={styles.heroClientRow}>
          <Text style={styles.heroClient}>{order.clientName}</Text>
          <TouchableOpacity style={styles.heroCallBtn} onPress={() => callClient(order.clientPhone)}>
            <Phone size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        {order.status === 'new' && (
          <Text style={styles.heroHint}>{t(locale, 'acceptAnytimeHint')}</Text>
        )}
        {order.status === 'assigned' && (
          <Text style={styles.heroHint}>{t(locale, 'earlyTripHint')}</Text>
        )}
        {btnKey || order.status === 'picked_up' ? (
          <Text style={styles.whatToDoLabel}>{t(locale, 'whatToDo')}</Text>
        ) : null}
        {renderPrimaryButton(order, true)}
        <TouchableOpacity style={styles.heroLinkBtn} onPress={() => openOrder(order)}>
          <Text style={styles.heroLinkText}>{t(locale, 'openOrder')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCalendarTimelineOrder = (order: Order, isLast: boolean) => {
    const time = formatTimeOnly(order.scheduledAt);
    const { label, color, bg } = getStatusLabel(locale, order.status);
    const completed = order.status === 'completed';
    return (
      <View key={order.id} style={styles.timelineRow}>
        <View style={styles.timelineTimeCol}>
          <Text style={styles.timelineTime}>{time}</Text>
        </View>
        <View style={styles.timelineRail}>
          <View style={[styles.timelineDot, completed && styles.timelineDotDone]} />
          {!isLast && <View style={styles.timelineLine} />}
        </View>
        <TouchableOpacity
          style={[styles.timelineCard, completed && styles.timelineCardDone]}
          onPress={() => openOrder(order)}
          activeOpacity={0.85}
        >
          <View style={styles.timelineCardHeader}>
            <Text style={styles.timelineOrderId}>#{order.id}</Text>
            <View style={[styles.statusBadge, styles.statusBadgeCompact, { backgroundColor: bg }]}>
              <Text style={[styles.statusBadgeTextCompact, { color }]}>{label}</Text>
            </View>
          </View>
          <Text style={styles.timelineAddress} numberOfLines={2}>{formatAddressDisplay(order.address, locale)}</Text>
          <Text style={styles.timelineClient}>{order.clientName}</Text>
          {order.operatorNote ? (
            <Text style={styles.timelineNote} numberOfLines={1}>{order.operatorNote}</Text>
          ) : null}
          <View style={styles.timelineTapHint}>
            <Text style={styles.timelineTapHintText}>{t(locale, 'openOrder')}</Text>
            <ChevronRight size={14} color="#94a3b8" />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.loginTopBar}>
            <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowSettings(!showSettings)}>
              <Settings color="#94a3b8" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerArea}>
            <View style={styles.logoCircle}>
              <Warehouse color="#fff" size={40} />
            </View>
            <Text style={styles.appTitle}>{t(locale, 'appTitle')}</Text>
            <Text style={styles.appSub}>{t(locale, 'appSub')}</Text>
          </View>

          {showSettings ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t(locale, 'settings')}</Text>
              <Text style={styles.label}>{t(locale, 'serverIp')}:</Text>
              <TextInput
                style={styles.input}
                value={serverIp}
                onChangeText={setServerIp}
                placeholder="crm-aziz.vercel.app"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.label}>{t(locale, 'port')}:</Text>
              <TextInput
                style={styles.input}
                value={port}
                onChangeText={setPort}
                placeholder={t(locale, 'portPlaceholder')}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={async () => {
                  try {
                    await AsyncStorage.setItem('@server_ip', serverIp);
                    await AsyncStorage.setItem('@server_port', port);
                    setShowSettings(false);
                  } catch {
                    showAlert(t(locale, 'loginError'), t(locale, 'saveSettingsError'));
                  }
                }}
              >
                <Text style={styles.saveBtnText}>{t(locale, 'save')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t(locale, 'signIn')}</Text>
              <View style={styles.inputContainer}>
                <User color="#94a3b8" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={username}
                  onChangeText={setUsername}
                  placeholder={t(locale, 'login')}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputContainer}>
                <Lock color="#94a3b8" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t(locale, 'password')}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>{t(locale, 'signIn')}</Text>}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <AlertModal
          visible={customAlert.visible}
          title={customAlert.title}
          message={customAlert.message}
          onClose={() => setCustomAlert(c => ({ ...c, visible: false }))}
          locale={locale}
          onOpenSettings={customAlert.openSettings ? () => Linking.openSettings() : undefined}
        />
      </SafeAreaView>
    );
  }

  const todayActiveCount = activeOrders.filter(o => isSameDay(new Date(o.scheduledAt), new Date())).length;
  const futureActiveCount = activeOrders.filter(o => !isSameDay(new Date(o.scheduledAt), new Date())).length;

  const bottomTabs = [
    { id: 'home' as const, label: t(locale, 'tabToday'), Icon: Home, count: todayActiveCount },
    { id: 'calendar' as const, label: t(locale, 'calendar'), Icon: Calendar, count: futureActiveCount },
    { id: 'history' as const, label: t(locale, 'history'), Icon: CheckCircle, count: 0 },
  ];


  return (
    <SafeAreaView style={styles.mainContainer} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.appHeader}>
        <View style={styles.driverInfoArea}>
          <Text style={styles.welcomeText}>{driver!.name}</Text>
          <Text style={styles.plateText}>{driver!.vehiclePlate}</Text>
        </View>
        <View style={styles.headerActions}>

          <TouchableOpacity style={styles.actionIconBtn} onPress={() => { fetchOrders(true); }}>
            <RefreshCw size={20} color="#4f46e5" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerMiniBtn}
            onPress={async () => {

              await clearSession();
            }}
          >
            <LogOut size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {isTrackingGps ? (
        <View style={styles.gpsActiveBar}>
          <View style={styles.pulseContainer}>
            <Animated.View style={[styles.pulseRing, { opacity: pulseAnim }]} />
            <View style={styles.pulseDot} />
          </View>
          <Navigation size={14} color="#065f46" style={{ marginRight: 6 }} />
          <Text style={styles.gpsActiveText}>{t(locale, 'gpsTracking')}</Text>
        </View>
      ) : (
        <View style={styles.gpsIdleBar}>
          <View style={styles.pulseContainer}>
            <View style={[styles.pulseDot, { backgroundColor: '#94a3b8' }]} />
          </View>
          <Navigation size={14} color="#94a3b8" style={{ marginRight: 6 }} />
          <Text style={styles.gpsIdleText}>{t(locale, 'gpsIdle')}</Text>
        </View>
      )}

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(false)} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 48 }} />
        ) : activeTab === 'home' ? (
          <View style={{ flex: 1 }}>
            <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 14, color: '#64748b', fontWeight: '600' }}>Заработано сегодня:</Text>
              <Text style={{ fontSize: 18, color: '#10b981', fontWeight: '800' }}>{todayEarned.toLocaleString()} {t(locale, 'currency')}</Text>
            </View>
            <View style={{ paddingHorizontal: 20 }}>
              {focusOrder ? (
                renderHeroCard(focusOrder)
              ) : (
                <View style={styles.emptyHero}>
                  <CheckCircle size={56} color="#10b981" />
                  <Text style={styles.emptyTitle}>{t(locale, 'allDone')}</Text>
                  <Text style={styles.emptySub}>{t(locale, 'allDoneSub')}</Text>
                </View>
              )}
              {otherActiveOrders.length > 0 && (
                <>
                  <Text style={styles.sectionHeading}>{t(locale, 'otherOrders')}</Text>
                  {otherActiveOrders.map((o, i) => renderCompactCard(o, i + 2))}
                </>
              )}
            </View>
          </View>
        ) : activeTab === 'calendar' ? (
          <View style={styles.calendarPanel}>
            <View style={styles.calendarToolbar}>
              <TouchableOpacity style={styles.calendarNavBtn} onPress={() => shiftCalendarWeek(-1)}>
                <ChevronLeft size={22} color="#475569" />
              </TouchableOpacity>
              <View style={styles.calendarToolbarCenter}>
                <Text style={styles.calendarMonthTitle}>{formatMonthYear(locale, selectedCalendarDate)}</Text>
                <TouchableOpacity style={styles.calendarTodayBtn} onPress={goToCalendarToday}>
                  <Text style={styles.calendarTodayBtnText}>{t(locale, 'goToToday')}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.calendarNavBtn} onPress={() => shiftCalendarWeek(1)}>
                <ChevronRight size={22} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={calendarScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.calendarScroll}
            >
              {calendarDays.map(day => {
                const selected = isSameDay(day, selectedCalendarDate);
                const isToday = isSameDay(day, new Date());
                const dayOrders = orders.filter(o => isSameDay(new Date(o.scheduledAt), day));
                const count = dayOrders.length;
                const hasActive = dayOrders.some(o => o.status !== 'completed' && o.status !== 'new');
                const hasNew = dayOrders.some(o => o.status === 'new');
                const dayNum = day.getDate();
                return (
                  <TouchableOpacity
                    key={day.toISOString()}
                    style={[
                      styles.calendarDay,
                      { width: CALENDAR_DAY_WIDTH },
                      isToday && !selected && styles.calendarDayToday,
                      selected && styles.calendarDaySelected,
                    ]}
                    onPress={() => {

                      const d = startOfDay(day);
                      setSelectedCalendarDate(d);
                      scrollCalendarToDay(d);
                    }}
                  >
                    <Text style={[styles.calendarWeekday, selected && styles.calendarDayTextSelected]}>
                      {getWeekdayShort(locale, day)}
                    </Text>
                    <Text style={[styles.calendarDayNum, selected && styles.calendarDayTextSelected]}>{dayNum}</Text>
                    {isToday && !selected ? (
                      <Text style={styles.calendarMiniLabel}>{t(locale, 'today')}</Text>
                    ) : null}
                    {count > 0 ? (
                      <View style={styles.calendarDotsRow}>
                        {hasActive && <View style={[styles.calendarDot, { backgroundColor: selected ? '#fde68a' : '#f59e0b' }]} />}
                        {hasNew && <View style={[styles.calendarDot, { backgroundColor: selected ? '#bfdbfe' : '#3b82f6' }]} />}
                        <View style={[styles.calendarBadge, selected && styles.calendarBadgeSelected]}>
                          <Text style={[styles.calendarBadgeText, selected && { color: '#fff' }]}>{count}</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.calendarEmptyDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={{ paddingHorizontal: 20, marginTop: 24, paddingBottom: 20 }}>
              <Text style={styles.sectionHeading}>
                {formatCalendarDayTitle(locale, selectedCalendarDate)}
              </Text>
              {ordersForCalendarDay.length === 0 ? (
                <View style={styles.calendarEmpty}>
                  <Clock size={40} color="#cbd5e1" />
                  <Text style={styles.emptyTitle}>{t(locale, 'noOrdersOnDate')}</Text>
                  <Text style={styles.emptySub}>{formatCalendarDayTitle(locale, selectedCalendarDate)}</Text>
                </View>
              ) : (
                <View>
                  {ordersForCalendarDay.map(o => renderCompactCard(o))}
                </View>
              )}
            </View>
          </View>
        ) : historyOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ClipboardList size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>{t(locale, 'noOrders')}</Text>
          </View>
        ) : (
          <View style={{ paddingBottom: 20, paddingTop: 12 }}>
            {groupedHistory.map(group => {
              const isExpanded = expandedHistoryDates.has(group.dateStr);
              return (
                <View key={group.dateStr} style={{ marginBottom: 12, marginHorizontal: 20 }}>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
                    activeOpacity={0.7}
                    onPress={() => {
                      setExpandedHistoryDates(prev => {
                        const next = new Set(prev);
                        if (next.has(group.dateStr)) next.delete(group.dateStr);
                        else next.add(group.dateStr);
                        return next;
                      });
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Calendar size={20} color="#4f46e5" />
                      <View>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#1e293b', textTransform: 'capitalize' }}>{group.dateStr}</Text>
                        <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{group.orders.length} заказов</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#10b981' }}>{group.totalAmount.toLocaleString()} {t(locale, 'currency')}</Text>
                    </View>
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={{ marginTop: 12 }}>
                      {group.orders.map(o => renderCompactCard(o))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>


      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {bottomTabs.map(({ id, label, Icon, count }) => (
          <TouchableOpacity
            key={id}
            style={styles.bottomNavItem}
            onPress={() => {

              if (id === 'calendar') {
                goToCalendarToday();
              }
              setActiveTab(id);
            }}
          >
            <Icon size={22} color={activeTab === id ? '#4f46e5' : '#94a3b8'} />
            <Text style={[styles.bottomNavLabel, activeTab === id && styles.bottomNavLabelActive]}>{label}</Text>
            {count > 0 ? (
              <View style={styles.bottomNavBadge}>
                <Text style={styles.bottomNavBadgeText}>{count > 9 ? '9+' : count}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>


      {selectedOrder && (() => {
        const order = selectedOrder;
        const isUpdating = updatingOrderId === order.id;
        return (
          <Modal animationType="slide" transparent visible onRequestClose={() => setSelectedOrder(null)}>
            <Pressable style={styles.modalOverlay} onPress={() => setSelectedOrder(null)}>
              <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => { setSelectedOrder(null); }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <X size={26} color="#1e293b" />
                  </TouchableOpacity>
                  <Text style={styles.modalOrderId}>#{order.id}</Text>
                </View>

                <ScrollView style={styles.modalScrollFlex} contentContainerStyle={{ paddingBottom: 16, paddingHorizontal: 20 }}>
                  <View style={styles.modalStatusRow}>
                    {renderStatusBadge(order.status)}
                    <Text style={styles.modalOrderIdInline}>#{order.id}</Text>
                  </View>
                  {renderStepProgress(order.status)}
                  <Text style={styles.modalScheduleLabel}>{t(locale, 'scheduledAt')}</Text>
                  <Text style={styles.modalBigTime}>{formatDate(order.scheduledAt)}</Text>
                  {order.status === 'assigned' && (
                    <Text style={styles.modalHint}>{t(locale, 'earlyTripHint')}</Text>
                  )}
                  {order.status === 'new' && queueActionMode(order, focusOrder) === 'accept_only' && (
                    <Text style={styles.modalHint}>{t(locale, 'acceptAnytimeHint')}</Text>
                  )}
                  {queueActionMode(order, focusOrder) === 'locked' && (
                    <Text style={styles.modalWarn}>{t(locale, 'finishCurrentFirst')}</Text>
                  )}
                  <Text style={styles.modalBigAddress}>{formatAddressDisplay(order.address, locale)}</Text>
                  <TouchableOpacity style={styles.navBtn} onPress={() => openNavigation(order)} activeOpacity={0.8}>
                    <Navigation size={16} color="#fff" />
                    <Text style={styles.navBtnText}>
                      Навигация (открыть карту)
                    </Text>
                  </TouchableOpacity>
                  {order.containerNumber ? (
                    <View style={styles.containerNumBadge}>
                      <Text style={styles.containerNumText}>📦 #{order.containerNumber}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.modalBigClient}>{order.clientName}</Text>

                  <TouchableOpacity style={styles.callBtn} onPress={() => callClient(order.clientPhone)}>
                    <Phone size={18} color="#4f46e5" />
                    <Text style={styles.callBtnText}>{t(locale, 'callClient')}</Text>
                  </TouchableOpacity>

                  {order.operatorNote ? (
                    <View style={styles.noteBox}>
                      <Text style={styles.noteText}>{order.operatorNote}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity style={styles.detailsToggle} onPress={() => setShowOrderDetails(v => !v)}>
                    <Text style={styles.detailsToggleText}>
                      {showOrderDetails ? t(locale, 'hideDetails') : t(locale, 'showDetails')}
                    </Text>
                  </TouchableOpacity>

                  {showOrderDetails && (
                    <View style={styles.detailsBlock}>
                      <Text style={styles.detailsLine}>
                        {t(locale, 'container')}: {order.containerSizeM3} m³
                      </Text>
                      <Text style={styles.detailsLine}>
                        {t(locale, 'duration')}: {getRentalLabel(locale, order.rentalDuration)}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <PaymentTypeIcon type={order.paymentType} size={16} color="#475569" />
                        <Text style={[styles.detailsLine, { marginTop: 0 }]}>
                          {order.paymentAmount.toLocaleString()} {t(locale, 'currency')} · {getPaymentLabel(locale, order.paymentType)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {order.status === 'in_progress' && canRunWorkflowOnOrder(order, focusOrder) && (
                    <TouchableOpacity
                      style={styles.altActionLink}
                      disabled={isUpdating}
                      onPress={() => { handleUpdateStatus(order.id, 'picked_up'); }}
                    >
                      <Text style={styles.altActionLinkText}>{t(locale, 'pickUpNow')}</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>

                {order.status !== 'completed' && (
                  <View style={styles.modalFooter}>
                    {renderPrimaryButton(order, true)}
                  </View>
                )}
              </Pressable>
            </Pressable>
          </Modal>
        );
      })()}

      <AlertModal
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        onClose={() => setCustomAlert(c => ({ ...c, visible: false }))}
        locale={locale}
        onOpenSettings={customAlert.openSettings ? () => Linking.openSettings() : undefined}
      />

      <Modal animationType="fade" transparent visible={!!navModalOrder} onRequestClose={() => setNavModalOrder(null)}>
        <Pressable style={styles.alertOverlay} onPress={() => setNavModalOrder(null)}>
          <View style={[styles.alertBox, { padding: 0, overflow: 'hidden' }]} onStartShouldSetResponder={() => true}>
            <View style={{ padding: 20, alignItems: 'center', backgroundColor: '#f8fafc', width: '100%', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
              <Navigation size={32} color="#4f46e5" style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b' }}>
                Выберите карту
              </Text>
            </View>
            <View style={{ width: '100%', padding: 16, gap: 12 }}>
              <TouchableOpacity style={[styles.alertBtn, { backgroundColor: '#fcd34d', flexDirection: 'row', justifyContent: 'center', gap: 8 }]} onPress={() => navModalOrder && openMapApp('yandex', navModalOrder)}>
                <MapPin size={20} color="#92400e" />
                <Text style={[styles.alertBtnText, { color: '#92400e' }]}>Yandex Maps</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.alertBtn, { backgroundColor: '#2563eb', flexDirection: 'row', justifyContent: 'center', gap: 8 }]} onPress={() => navModalOrder && openMapApp('google', navModalOrder)}>
                <MapPin size={20} color="#fff" />
                <Text style={styles.alertBtnText}>Google Maps</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.alertBtn, styles.alertBtnSecondary, { marginTop: 4 }]} onPress={() => setNavModalOrder(null)}>
                <Text style={styles.alertBtnTextSecondary}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loginContainer: { flex: 1, backgroundColor: '#0B0F19', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  loginTopBar: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 8, gap: 8 },
  settingsBtn: { padding: 8 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#334155' },
  langBtnText: { color: '#e2e8f0', fontWeight: '700', fontSize: 12 },
  langBtnLight: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#e0e7ff', marginRight: 4 },
  langBtnLightText: { color: '#4f46e5', fontWeight: '700', fontSize: 12 },
  headerArea: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', elevation: 10 },
  appTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 16 },
  appSub: { fontSize: 12, color: '#94a3b8', marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: '#1E293B', borderRadius: 24, padding: 24, elevation: 5 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
  label: { color: '#94a3b8', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: '#0F172A', borderColor: '#334155', borderWidth: 1, borderRadius: 12, padding: 12, color: '#fff', marginBottom: 16, fontSize: 16 },
  saveBtn: { backgroundColor: '#4f46e5', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderColor: '#334155', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 16, height: 52 },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, color: '#fff', fontSize: 16, height: '100%' },
  loginBtn: { backgroundColor: '#4f46e5', height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  gpsActiveBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 16, paddingVertical: 8 },
  gpsIdleBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8 },
  pulseContainer: { height: 12, width: 12, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  pulseRing: { position: 'absolute', height: 20, width: 20, borderRadius: 10, backgroundColor: '#34d399' },
  pulseDot: { height: 8, width: 8, borderRadius: 4, backgroundColor: '#10b981' },
  gpsActiveText: { fontSize: 12, color: '#065f46', fontWeight: '600', flex: 1 },
  gpsIdleText: { fontSize: 12, color: '#64748b', fontWeight: '600', flex: 1 },
  mainContainer: { flex: 1, backgroundColor: '#f1f5f9' },
  mainScroll: { flex: 1 },
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff' },
  driverInfoArea: { flex: 1 },
  welcomeText: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  plateText: { fontSize: 13, color: '#64748b', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerMiniBtn: { padding: 8, borderRadius: 10, backgroundColor: '#f8fafc' },
  headerMiniBtnText: { fontSize: 12, fontWeight: '800', color: '#4f46e5' },
  actionIconBtn: { padding: 8, borderRadius: 10, backgroundColor: '#eef2ff' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8 },
  bottomNavItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, position: 'relative' },
  bottomNavLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: '600' },
  bottomNavLabelActive: { color: '#4f46e5', fontWeight: '800' },
  bottomNavBadge: { position: 'absolute', top: 0, right: '22%', backgroundColor: '#ef4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  bottomNavBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  heroCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 2, borderColor: '#2563eb', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  heroLabel: { fontSize: 12, fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 },
  heroTimeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  heroScheduleBlock: { marginTop: 12 },
  heroScheduleLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  heroDateSub: { fontSize: 15, color: '#64748b', marginTop: 2, fontWeight: '600' },
  heroHint: { fontSize: 13, color: '#0369a1', backgroundColor: '#e0f2fe', padding: 10, borderRadius: 10, marginTop: 12, lineHeight: 18 },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 4 },
  stepItem: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepDotDone: { backgroundColor: '#10b981' },
  stepDotActive: { backgroundColor: '#2563eb' },
  stepDotNum: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  stepDotNumActive: { color: '#fff' },
  stepLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '600', textAlign: 'center' },
  stepLabelActive: { color: '#2563eb', fontWeight: '800' },
  heroTime: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginTop: 12 },
  heroAddress: { fontSize: 18, color: '#1e293b', marginTop: 8, lineHeight: 26, fontWeight: '600' },
  heroNavBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start' },
  heroNavBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 11, paddingHorizontal: 16 },
  navBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1 },
  containerNumBadge: { marginTop: 8, backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#e2e8f0' },
  containerNumText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  heroClientRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  heroClient: { fontSize: 16, color: '#64748b', flex: 1 },
  heroCallBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  whatToDoLabel: { fontSize: 13, color: '#64748b', marginTop: 16, fontWeight: '600' },
  heroBtn: { marginTop: 12, height: 58, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  heroPayBlock: { marginTop: 8 },
  payHint: { fontSize: 14, color: '#475569', fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  heroLinkBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 8 },
  heroLinkText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  emptyHero: { backgroundColor: '#fff', borderRadius: 20, padding: 40, alignItems: 'center', marginBottom: 16 },
  sectionHeading: { fontSize: 14, fontWeight: '700', color: '#64748b', marginBottom: 12, marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusBadgeCompact: { paddingHorizontal: 8, paddingVertical: 2 },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  statusBadgeTextCompact: { fontSize: 10 },
  calendarPanel: { marginBottom: 8 },
  calendarToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
  calendarNavBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  calendarToolbarCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  calendarMonthTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', textTransform: 'capitalize' },
  calendarTodayBtn: { marginTop: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: '#eef2ff' },
  calendarTodayBtnText: { fontSize: 12, fontWeight: '700', color: '#4f46e5' },
  calendarScroll: { paddingHorizontal: 12, paddingVertical: 8, alignItems: 'flex-end', marginBottom: 12 },
  calendarDay: { paddingVertical: 10, paddingHorizontal: 6, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8, alignItems: 'center', minHeight: 88 },
  calendarDayToday: { borderColor: '#4f46e5', borderWidth: 2, backgroundColor: '#eef2ff' },
  calendarDaySelected: { backgroundColor: '#4f46e5', borderColor: '#4f46e5', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  calendarWeekday: { fontSize: 11, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' },
  calendarDayNum: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  calendarDayTextSelected: { color: '#fff' },
  calendarMiniLabel: { fontSize: 9, color: '#4f46e5', fontWeight: '700', marginTop: 2 },
  calendarDotsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 3, minHeight: 14 },
  calendarEmptyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e2e8f0', marginTop: 8 },
  calendarDot: { width: 5, height: 5, borderRadius: 3 },
  calendarBadge: { backgroundColor: '#e0e7ff', borderRadius: 8, minWidth: 18, height: 18, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  calendarBadgeSelected: { backgroundColor: 'rgba(255,255,255,0.35)' },
  calendarBadgeText: { fontSize: 10, fontWeight: '800', color: '#4f46e5' },
  selectedDayCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  selectedDayHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  selectedDayHeaderText: { flex: 1 },
  selectedDayTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', lineHeight: 22 },
  selectedDaySub: { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '600' },
  selectedDayStats: { flexDirection: 'row', gap: 8, marginTop: 14 },
  statChip: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  statChipDone: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  statChipLabel: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  statChipValue: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  calendarEmpty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  timelineList: { paddingBottom: 24 },
  timelineRow: { flexDirection: 'row', marginBottom: 4 },
  timelineTimeCol: { width: 52, paddingTop: 14, alignItems: 'flex-end', paddingRight: 8 },
  timelineTime: { fontSize: 15, fontWeight: '800', color: '#4f46e5' },
  timelineRail: { width: 20, alignItems: 'center', paddingTop: 16 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4f46e5', borderWidth: 2, borderColor: '#fff', zIndex: 1 },
  timelineDotDone: { backgroundColor: '#10b981' },
  timelineLine: { flex: 1, width: 2, backgroundColor: '#e2e8f0', marginTop: 4, marginBottom: -8, minHeight: 24 },
  timelineCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', marginLeft: 4 },
  timelineCardDone: { opacity: 0.85, backgroundColor: '#f8fafc' },
  timelineCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  timelineOrderId: { fontSize: 13, fontWeight: '800', color: '#64748b' },
  timelineAddress: { fontSize: 15, fontWeight: '600', color: '#1e293b', lineHeight: 21 },
  timelineClient: { fontSize: 13, color: '#64748b', marginTop: 4 },
  timelineNote: { fontSize: 12, color: '#b45309', marginTop: 6, fontStyle: 'italic' },
  timelineTapHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 10, gap: 2 },
  timelineTapHintText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  ordersListContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  orderCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  orderCardFocus: { borderColor: '#2563eb', borderWidth: 2 },
  orderTimeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  orderAddressRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 },
  orderCardTap: { flexDirection: 'row', alignItems: 'center', paddingRight: 12 },
  orderCardAction: { paddingHorizontal: 12, paddingBottom: 12 },
  orderCardBody: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  orderCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  orderQueue: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  orderTime: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  orderAddress: { fontSize: 15, color: '#334155', lineHeight: 21, fontWeight: '500' },
  orderMeta: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  quickActionBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickActionText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  compactPayRow: { paddingTop: 4 },
  orderInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoIcon: { marginRight: 8 },
  infoText: { fontSize: 13, color: '#475569', flex: 1 },
  amountText: { fontSize: 15, fontWeight: 'bold', color: '#10b981' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#475569', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', minHeight: '55%', flexDirection: 'column' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 12 },
  modalOrderId: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#64748b' },
  modalScrollFlex: { flexShrink: 1, flexGrow: 1 },
  modalBigTime: { fontSize: 15, color: '#64748b', fontWeight: '600' },
  modalBigAddress: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginTop: 8, lineHeight: 30 },
  modalBigClient: { fontSize: 17, color: '#475569', marginTop: 8 },
  callBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, paddingVertical: 14, borderRadius: 14, backgroundColor: '#eef2ff' },
  callBtnText: { fontSize: 16, fontWeight: '700', color: '#4f46e5' },
  detailsToggle: { marginTop: 20, paddingVertical: 10 },
  detailsToggleText: { fontSize: 14, color: '#64748b', fontWeight: '600', textAlign: 'center' },
  detailsBlock: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, gap: 6 },
  detailsLine: { fontSize: 14, color: '#475569' },
  altActionLink: { marginTop: 16, paddingVertical: 12, alignItems: 'center' },
  altActionLinkText: { fontSize: 15, color: '#14b8a6', fontWeight: '700' },
  noteBox: { backgroundColor: '#fffbeb', borderRadius: 12, padding: 14, marginTop: 16 },
  noteText: { fontSize: 14, color: '#b45309', lineHeight: 20 },
  modalFooter: { paddingHorizontal: 20, paddingVertical: 16, paddingBottom: Platform.OS === 'ios' ? 28 : 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fff' },
  paymentRow: { flexDirection: 'row', gap: 8 },
  payChip: { flex: 1, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 12, alignItems: 'center', minHeight: 72, justifyContent: 'center', gap: 6 },
  payChipText: { color: '#fff', fontSize: 10, fontWeight: '800', textAlign: 'center' },
  lockedBtn: { backgroundColor: '#e2e8f0' },
  lockedBtnText: { color: '#64748b', fontSize: 14, fontWeight: '700' },
  lockedBlock: { paddingVertical: 8 },
  lockedHint: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 18 },
  modalStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalOrderIdInline: { fontSize: 14, fontWeight: '700', color: '#94a3b8' },
  modalScheduleLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 8 },
  modalHint: { fontSize: 13, color: '#0369a1', backgroundColor: '#e0f2fe', padding: 10, borderRadius: 10, marginTop: 10, lineHeight: 18 },
  modalWarn: { fontSize: 13, color: '#b45309', backgroundColor: '#fffbeb', padding: 10, borderRadius: 10, marginTop: 10, lineHeight: 18 },
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  alertBox: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '100%', alignItems: 'center', elevation: 5 },
  alertTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 8, textAlign: 'center' },
  alertMessage: { fontSize: 15, color: '#475569', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  alertBtn: { backgroundColor: '#4f46e5', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center' },
  alertBtnSecondary: { backgroundColor: '#e2e8f0' },
  alertBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  alertBtnTextSecondary: { color: '#475569' },
});
