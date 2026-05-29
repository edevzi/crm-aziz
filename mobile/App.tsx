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
  LayoutAnimation,
  UIManager,
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
  Gift as LucideGift,
  Wallet as LucideWallet,
  UserCircle as LucideUserCircle,
  Car as LucideCar,
  TrendingUp as LucideTrendingUp,
  PackageCheck as LucidePackageCheck,
  ChevronDown as LucideChevronDown,
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

const Warehouse = LucideWarehouse as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const User = LucideUser as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const Lock = LucideLock as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const LogOut = LucideLogOut as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const Settings = LucideSettings as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const ClipboardList = LucideClipboardList as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const Calendar = LucideCalendar as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const CheckCircle = LucideCheckCircle as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const Phone = LucidePhone as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const RefreshCw = LucideRefreshCw as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const X = LucideX as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const AlertCircle = LucideAlertCircle as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const Navigation = LucideNavigation as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const ChevronRight = LucideChevronRight as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const ChevronLeft = LucideChevronLeft as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const Home = LucideHome as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const Banknote = LucideBanknote as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const CreditCard = LucideCreditCard as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const Smartphone = LucideSmartphone as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const Clock = LucideClock as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const MapPin = LucideMapPin as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const UserCircle = LucideUserCircle as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const Car = LucideCar as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const TrendingUp = LucideTrendingUp as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const PackageCheck = LucidePackageCheck as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const ChevronDown = LucideChevronDown as React.ComponentType<{ color?: string; size?: number; style?: object }>;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

const TRIP_STATUSES = new Set(['in_progress', 'picked_up']);
const WORKING_STATUSES = new Set(['assigned', 'in_progress', 'picked_up']);

function getWorkflowRank(status: string): number {
  return WORKFLOW_RANK[status] ?? -1;
}

const PaymentTypeIcon = ({ type, size = 16, color = '#64748b' }: { type: string, size?: number, color?: string }) => {
  if (type === 'cash') return <Banknote size={size} color={color} />;
  if (type === 'card' || type === 'online') return <CreditCard size={size} color={color} />;
  return null;
};

function filterActiveOrders(list: Order[]): Order[] {
  return list.filter(o => o.status !== 'completed');
}

function computeFocusOrder(list: Order[]): Order | null {
  const active = filterActiveOrders(list);
  if (active.length === 0) return null;

  // Active trip order is one that is in progress or picked up
  const activeTrip = active.filter(o => TRIP_STATUSES.has(o.status));
  if (activeTrip.length > 0) {
    return activeTrip.sort((a, b) => getWorkflowRank(b.status) - getWorkflowRank(a.status))[0];
  }

  // If no active trip, but there is an assigned order, return the earliest assigned order
  const assigned = active.filter(o => o.status === 'assigned');
  if (assigned.length > 0) {
    return assigned.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];
  }

  // Otherwise, return the earliest new order
  const newOrders = active.filter(o => o.status === 'new');
  if (newOrders.length > 0) {
    return newOrders.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];
  }

  return null;
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
    .filter(o => o.id !== focusId && o.status !== 'container_placed')
    .sort((a, b) => {
      const aWorking = WORKING_STATUSES.has(a.status) ? 0 : 1;
      const bWorking = WORKING_STATUSES.has(b.status) ? 0 : 1;
      if (aWorking !== bWorking) return aWorking - bWorking;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });
}

function hasBlockingWorkflow(focus: Order | null): boolean {
  return focus != null && (focus.status === 'in_progress' || focus.status === 'picked_up');
}

function canRunWorkflowOnOrder(order: Order, focus: Order | null): boolean {
  if (!focus || focus.id === order.id) return true;
  // Starting a trip (assigned -> in_progress) or picking up a container (container_placed -> picked_up)
  // is blocked if there's already another order actively in progress or picked up.
  if (order.status === 'assigned' || order.status === 'container_placed') {
    if (focus.status === 'in_progress' || focus.status === 'picked_up') {
      return false;
    }
  }
  return true;
}

function queueActionMode(order: Order, focus: Order | null): 'full' | 'accept_only' | 'locked' {
  if (!focus || focus.id === order.id) return 'full';
  if (order.status === 'new') return 'accept_only';
  if ((focus.status === 'in_progress' || focus.status === 'picked_up') && order.status !== 'container_placed') {
    return 'locked';
  }
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
  photoUrl?: string | null;
  driverFee?: number | null;
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

function getMonthShort(locale: string, d: Date): string {
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return months[d.getMonth()];
}

function getMonthFull(locale: string, d: Date): string {
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  return months[d.getMonth()];
}

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

  const twoHoursInMs = 2 * 60 * 60 * 1000;
  const isLate = elapsed >= twoHoursInMs;
  const remainingMs = isLate ? 0 : (twoHoursInMs - elapsed);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const color = isLate ? '#ef4444' : '#f59e0b';
  const bgColor = isLate ? '#fee2e2' : '#fef3c7';
  
  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');

  return (
    <View style={[styles.timerContainer, { backgroundColor: bgColor }]}>
      <Clock size={14} color={color} style={{ marginRight: 6 }} />
      <Text style={[styles.timerText, { color }]}>
        {hStr}:{mStr}:{sStr} {isLate ? '(Просрочено!)' : ''}
      </Text>
    </View>
  );
};

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
    case 'new': return '#2563EB';
    case 'assigned': return '#F59E0B';
    case 'in_progress': return '#EA580C';
    case 'container_placed': return '#0D9488';
    case 'picked_up': return '#10B981';
    default: return '#4F46E5';
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
          <AlertCircle size={44} color="#4F46E5" style={{ marginBottom: 16 }} />
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
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'history' | 'profile'>('home');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [navModalOrder, setNavModalOrder] = useState<Order | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(startOfDay(new Date()));
  const [displayedMonth, setDisplayedMonth] = useState<Date>(() => startOfDay(new Date()));
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [pinnedFocusId, setPinnedFocusId] = useState<number | null>(null);
  const [isOverdueExpanded, setIsOverdueExpanded] = useState(false);

  const [historyFilter, setHistoryFilter] = useState<'day' | 'week' | 'month'>('day');
  const [historyOffset, setHistoryOffset] = useState<number>(0);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number>(6);

  const knownOrderIds = useRef<Set<number>>(new Set());
  const initialFetchDone = useRef(false);

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
        /* retry */
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

  useEffect(() => {
    let active = true;

    const startTracking = async () => {
      if (!isLoggedIn || !driver) {
        if (locationSubscription.current) {
          locationSubscription.current.remove();
          locationSubscription.current = null;
          try {
            stopBackgroundLocationTracking();
          } catch (e) {}
        }
        setIsTrackingGps(false);
        return;
      }

      let fg = await Location.getForegroundPermissionsAsync();
      if (fg.status !== 'granted') {
        fg = await Location.requestForegroundPermissionsAsync();
      }
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

    const timer = setTimeout(() => {
      startTracking();
    }, 1500);

    return () => {
      active = false;
      clearTimeout(timer);
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, [isLoggedIn, driver, locale, showAlert, postLocation]);

  const pushTokenSentRef = useRef(false);

  useEffect(() => {
    if (isLoggedIn && driver && !pushTokenSentRef.current) {
      pushTokenSentRef.current = true;
      const setupPush = async () => {
        const token = await registerForPushNotificationsAsync(locale);
        if (token) {
          try {
            await fetch(`${getApiUrl()}/driver/push-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ driverId: driver.id, expoPushToken: token }),
            });
          } catch { /* ignore */ }
        }
      };
      setupPush();
    }
    if (!isLoggedIn) {
      pushTokenSentRef.current = false;
    }
  }, [isLoggedIn, driver]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
    });
    return () => subscription.remove();
  }, []);

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
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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

  const handlePickupContainer = (order: Order) => {
    if (updatingOrderId !== null) return;
    if (!canRunWorkflowOnOrder(order, focusOrder)) {
      showAlert(t(locale, 'lockedAction'), t(locale, 'finishCurrentFirst'));
      return;
    }

    Alert.alert(
      "Фото-отчет",
      "Прикрепите фото контейнера для подтверждения получения. Это обязательное действие.",
      [
        {
          text: "Сделать фото",
          onPress: () => promptPickupPhotoCapture(order)
        },
        {
          text: "Отмена",
          style: "cancel"
        }
      ]
    );
  };

  const promptPickupPhotoCapture = async (order: Order) => {
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
          pickupContainerWithPhoto(order, base64Img);
        } else {
          showAlert("Ошибка", "Не удалось обработать фото");
        }
      } catch (err) {
        console.error('Image compression failed:', err);
        showAlert("Ошибка", "Ошибка сжатия изображения");
      }
    }
  };

  const pickupContainerWithPhoto = async (order: Order, photoBase64: string | null) => {
    if (!photoBase64) {
      showAlert("Ошибка", "Фото отчёт обязателен для подтверждения получения контейнера.");
      return;
    }
    setUpdatingOrderId(order.id);
    const isBeznal = order.paymentType === 'card' || order.paymentType === 'online';

    try {
      const payload: any = {};
      payload.photoUrl = photoBase64;

      if (isBeznal) {
        payload.status = 'completed';
        payload.paymentStatus = 'received';
      } else {
        payload.status = 'picked_up';
        payload.paymentStatus = 'pending';
      }

      const response = await fetch(`${getApiUrl()}/driver/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Не удалось обновить статус заказа");

      setOrders(prev =>
        prev.map(o =>
          o.id === order.id
            ? {
                ...o,
                status: payload.status,
                paymentStatus: payload.paymentStatus,
                photoUrl: photoBase64 || o.photoUrl,
              }
            : o
        )
      );

      if (selectedOrder?.id === order.id) {
        setSelectedOrder(prev =>
          prev
            ? {
                ...prev,
                status: payload.status,
                paymentStatus: payload.paymentStatus,
                photoUrl: photoBase64 || prev.photoUrl,
              }
            : null
        );
      }

      if (payload.status === 'completed') {
        setSelectedOrder(null);
        if (pinnedFocusId === order.id) setPinnedFocusId(null);
        showAlert("Готово", "Заказ успешно завершен, безналичная оплата получена!");
      } else {
        showAlert("Забрал контейнер", "Контейнер успешно забран. Пожалуйста, примите наличные средства от клиента.");
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Ошибка при переходе";
      showAlert("Ошибка", msg);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleReceivedCash = async (order: Order) => {
    setUpdatingOrderId(order.id);
    try {
      const response = await fetch(`${getApiUrl()}/driver/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'received' }),
      });

      if (!response.ok) throw new Error("Не удалось подтвердить оплату");

      setOrders(prev =>
        prev.map(o => (o.id === order.id ? { ...o, paymentStatus: 'received' } : o))
      );

      setSelectedOrder(prev => (prev?.id === order.id ? { ...prev, paymentStatus: 'received' } : prev));

      showAlert("Наличные получены", "Оплата подтверждена. Теперь вы можете завершить заказ.");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Ошибка подтверждения оплаты";
      showAlert("Ошибка", msg);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleFinalizeCashOrder = async (order: Order) => {
    setUpdatingOrderId(order.id);
    try {
      const response = await fetch(`${getApiUrl()}/driver/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (!response.ok) throw new Error("Не удалось завершить заказ");

      setOrders(prev =>
        prev.map(o => (o.id === order.id ? { ...o, status: 'completed' } : o))
      );

      setSelectedOrder(null);
      if (pinnedFocusId === order.id) setPinnedFocusId(null);

      showAlert("Успешно", "Заказ успешно завершен!");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Ошибка завершения заказа";
      showAlert("Ошибка", msg);
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

  // Calendar Monthly Grid generator logic
  const calendarGridDays = useMemo(() => {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth(); // 0-indexed

    // First day of month
    const firstDay = new Date(year, month, 1);
    let startDayOfWeek = firstDay.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    // Adjust to Monday first (0 = Mon, 6 = Sun)
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const grid: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

    // Prev month days filler
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const d = new Date(year, month - 1, dayNum);
      grid.push({ date: d, isCurrentMonth: false, key: `prev-${dayNum}` });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      grid.push({ date: d, isCurrentMonth: true, key: `curr-${i}` });
    }

    // Next month filler days (fill up to 42 slots for perfect 6 rows)
    const remainingSlots = 42 - grid.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const d = new Date(year, month + 1, i);
      grid.push({ date: d, isCurrentMonth: false, key: `next-${i}` });
    }

    return grid;
  }, [displayedMonth]);

  const shiftMonth = useCallback((delta: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDisplayedMonth(prev => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + delta, 1);
      return next;
    });
  }, []);

  const handleSelectCalendarDate = useCallback((date: Date) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCalendarDate(startOfDay(date));
  }, []);

  const handleGoToCalendarToday = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const today = startOfDay(new Date());
    setSelectedCalendarDate(today);
    setDisplayedMonth(new Date(today));
  }, []);

  useEffect(() => {
    if (activeTab === 'calendar') {
      setDisplayedMonth(new Date(selectedCalendarDate));
    }
  }, [activeTab]);

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
    const today = startOfDay(new Date());
    return historyOrders
      .filter(o => {
        // Match by scheduledAt OR updatedAt so orders completed today show up
        const scheduledDate = new Date(o.scheduledAt);
        const updatedDate = new Date(o.updatedAt);
        return isSameDay(scheduledDate, today) || isSameDay(updatedDate, today);
      })
      .reduce((sum, o) => sum + (Number(o.paymentAmount) || 0), 0);
  }, [historyOrders]);

  const historyChartData = useMemo(() => {
    const periods: { label: string, fullLabel: string, dateStart: Date, dateEnd: Date, totalAmount: number, orderCount: number }[] = [];
    
    if (historyFilter === 'day') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i - (historyOffset * 7));
        const start = startOfDay(d);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        
        let label = getWeekdayShort(locale, d);
        let fullLabel = `${d.getDate()} ${getMonthFull(locale, d).toLowerCase()}`;
        if (historyOffset === 0) {
          if (i === 0) fullLabel = 'Сегодня';
          else if (i === 1) fullLabel = 'Вчера';
        }
        
        periods.push({ label: `${d.getDate()}\n${label}`, fullLabel, dateStart: start, dateEnd: end, totalAmount: 0, orderCount: 0 });
      }
    } else if (historyFilter === 'week') {
      for (let i = 3; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay() + 1 - (i * 7) - (historyOffset * 28)); // Monday start
        const start = startOfDay(d);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        
        const label = `${start.getDate()}-${end.getDate() - 1}`;
        periods.push({ label, fullLabel: `Неделя ${label}`, dateStart: start, dateEnd: end, totalAmount: 0, orderCount: 0 });
      }
    } else if (historyFilter === 'month') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i - (historyOffset * 6), 1);
        const start = startOfDay(d);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        
        const label = getMonthShort(locale, start);
        periods.push({ label, fullLabel: `${getMonthFull(locale, start)} ${start.getFullYear()}`, dateStart: start, dateEnd: end, totalAmount: 0, orderCount: 0 });
      }
    }
    
    historyOrders.forEach(o => {
      const time = new Date(o.scheduledAt).getTime();
      for (let i = 0; i < periods.length; i++) {
        if (time >= periods[i].dateStart.getTime() && time < periods[i].dateEnd.getTime()) {
          periods[i].totalAmount += (Number(o.paymentAmount) || 0);
          periods[i].orderCount++;
          break;
        }
      }
    });
    
    return periods;
  }, [historyFilter, historyOffset, historyOrders, locale]);

  useEffect(() => {
    setSelectedHistoryIndex(historyFilter === 'day' ? 6 : historyFilter === 'week' ? 3 : 5);
    setHistoryOffset(0);
  }, [historyFilter]);

  const openOrder = (order: Order) => {
    setShowOrderDetails(false);
    setSelectedOrder(order);
  };

  const runPrimaryAction = (order: Order) => {
    if (order.status === 'container_placed') {
      handlePickupContainer(order);
      return;
    }
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
      <View style={styles.stepProgressWrapper}>
        <View style={styles.stepTrackBackground} />
        <View style={[
          styles.stepTrackActive,
          { width: `${Math.min(100, Math.max(0, (current - 1.5) * 33.33))}%` }
        ]} />
        <View style={styles.stepItemRow}>
          {STEP_KEYS.map((key, i) => {
            const stepNum = i + 1;
            const done = stepNum < current;
            const active = stepNum === current;
            return (
              <View key={key} style={styles.stepItemBox}>
                <View style={[
                  styles.stepDotCircle,
                  done && styles.stepDotCircleDone,
                  active && styles.stepDotCircleActive,
                ]}>
                  {done ? (
                    <CheckCircle size={14} color="#FFF" />
                  ) : (
                    <Text style={[styles.stepDotNumberText, active && styles.stepDotNumberTextActive]}>{stepNum}</Text>
                  )}
                </View>
                <Text style={[styles.stepDotLabelText, active && styles.stepDotLabelTextActive]} numberOfLines={1}>
                  {t(locale, key)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderStatusBadge = (status: string, compact = false) => {
    const { label, color, bg } = getStatusLabel(locale, status);
    return (
      <View style={[styles.badgeContainer, { backgroundColor: bg }, compact && styles.badgeContainerCompact]}>
        <View style={[styles.badgeDot, { backgroundColor: color }]} />
        <Text style={[styles.badgeText, { color }, compact && styles.badgeTextCompact]}>{label}</Text>
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
      <View key={order.id} style={[styles.feedCard, isFocus && styles.feedCardActive]}>
        <TouchableOpacity style={styles.feedCardTapArea} onPress={() => openOrder(order)} activeOpacity={0.9}>
          <View style={styles.feedCardHeader}>
            <Text style={styles.feedCardId}>
              {queueIndex != null ? `${t(locale, 'queueNext')} #${queueIndex}` : `#${order.id}`}
            </Text>
            {renderStatusBadge(order.status, true)}
          </View>
          
          <View style={styles.feedCardBody}>
            <View style={styles.infoLine}>
              <Clock size={15} color="#4F46E5" style={{ marginRight: 6 }} />
              <Text style={styles.infoTimeText}>{inCalendar ? scheduledFull : timeOnly}</Text>
            </View>
            <View style={styles.infoLine}>
              <MapPin size={15} color="#94A3B8" style={{ marginTop: 2, marginRight: 6 }} />
              <Text style={styles.infoAddressText} numberOfLines={2}>{formatAddressDisplay(order.address, locale)}</Text>
            </View>
            
            <View style={styles.feedCardSeparator} />
            
            <View style={styles.feedCardFooter}>
              <Text style={styles.feedCardClient}>{order.clientName}</Text>
              <View style={styles.paymentBadge}>
                <PaymentTypeIcon type={order.paymentType} size={12} color="#10B981" />
                <Text style={styles.paymentBadgeText}>
                  {(order.paymentAmount || 0).toLocaleString()} {t(locale, 'currency')}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        
        {order.status === 'container_placed' && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <ContainerTimer updatedAt={order.updatedAt} />
          </View>
        )}

        {showAction && order.status !== 'completed' && (
          <View style={styles.feedCardActionBlock}>
            {isPayment && mode === 'locked' ? (
              <View style={[styles.cardActionBtn, styles.cardActionBtnLocked]}>
                <Text style={styles.cardActionBtnLockedText}>{t(locale, 'finishCurrentFirst')}</Text>
              </View>
            ) : isPayment ? (
              <TouchableOpacity
                style={[styles.cardActionBtn, { backgroundColor: '#10B981', flexDirection: 'row', gap: 6 }]}
                onPress={() => openOrder(order)}
                activeOpacity={0.85}
              >
                <CreditCard size={15} color="#FFFFFF" />
                <Text style={styles.cardActionBtnText}>{t(locale, 'stepPayment')}</Text>
              </TouchableOpacity>
            ) : (
              renderPrimaryButton(order, false)
            )}
          </View>
        )}
      </View>
    );
  };

  const renderPrimaryButton = (order: Order, large = false) => {
    const btnKey = getPrimaryButtonKey(order.status);
    const isUpdating = updatingOrderId === order.id;
    const btnStyle = large ? styles.actionButtonLarge : styles.cardActionBtn;
    const txtStyle = large ? styles.actionButtonLargeText : styles.cardActionBtnText;
    const mode = queueActionMode(order, focusOrder);

    if (order.status === 'picked_up') {
      if (mode === 'locked') {
        return (
          <View style={[large ? styles.payLockWrapperLarge : styles.payLockWrapperCompact]}>
            <Text style={styles.payLockText}>{t(locale, 'finishCurrentFirst')}</Text>
          </View>
        );
      }

      const hasPaid = order.paymentStatus === 'received' || order.paymentStatus === 'entered';

      if (hasPaid) {
        return (
          <View style={large ? styles.payOptionBlockLarge : styles.payOptionBlockCompact}>
            <View style={styles.paidBadgeBanner}>
              <CheckCircle size={16} color="#FFFFFF" />
              <Text style={styles.paidBadgeText}>Оплата получена (Наличные)</Text>
            </View>
            <TouchableOpacity
              style={[btnStyle, { backgroundColor: '#10B981' }, isUpdating && styles.buttonDisabled]}
              disabled={isUpdating}
              onPress={() => handleFinalizeCashOrder(order)}
              activeOpacity={0.85}
            >
              {isUpdating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={txtStyle}>{t(locale, 'btnComplete')}</Text>}
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <View style={large ? styles.payOptionBlockLarge : styles.payOptionBlockCompact}>
          <Text style={styles.payHintText}>Ожидание оплаты наличными</Text>
          <TouchableOpacity
            style={[btnStyle, { backgroundColor: '#F59E0B', flexDirection: 'row', gap: 8, justifyContent: 'center' }, isUpdating && styles.buttonDisabled]}
            disabled={isUpdating}
            onPress={() => handleReceivedCash(order)}
            activeOpacity={0.85}
          >
            <Banknote size={18} color="#FFFFFF" />
            <Text style={txtStyle}>Получил наличные</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (mode === 'locked') {
      return (
        <View style={[btnStyle, styles.cardActionBtnLocked]}>
          <Text style={styles.cardActionBtnLockedText}>{t(locale, 'lockedAction')}</Text>
        </View>
      );
    }

    if (mode === 'accept_only' && order.status !== 'new') {
      return (
        <View style={[btnStyle, styles.cardActionBtnLocked]}>
          <Text style={styles.cardActionBtnLockedText}>{t(locale, 'lockedAction')}</Text>
        </View>
      );
    }

    if (!btnKey) return null;

    return (
      <TouchableOpacity
        style={[btnStyle, { backgroundColor: getPrimaryActionColor(order.status) }, isUpdating && styles.buttonDisabled]}
        disabled={isUpdating}
        onPress={() => runPrimaryAction(order)}
        activeOpacity={0.85}
      >
        {isUpdating ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={txtStyle}>{t(locale, btnKey)}</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.darkAuthContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
        <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.authTopBar}>
            <TouchableOpacity style={styles.authSettingsBtn} onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowSettings(!showSettings);
            }} activeOpacity={0.7}>
              <Settings color="#64748B" size={18} />
            </TouchableOpacity>
          </View>

          <View style={styles.brandContainer}>
            <View style={styles.brandIconWrapper}>
              <Warehouse color="#FFFFFF" size={38} />
            </View>
            <Text style={styles.brandTitle}>{t(locale, 'appTitle')}</Text>
            <Text style={styles.brandSubTitle}>{t(locale, 'appSub')}</Text>
          </View>

          {showSettings ? (
            <View style={styles.glassAuthCard}>
              <Text style={styles.authCardTitle}>{t(locale, 'settings')}</Text>
              
              <Text style={styles.inputHeading}>{t(locale, 'serverIp')}</Text>
              <TextInput
                style={styles.authInput}
                value={serverIp}
                onChangeText={setServerIp}
                placeholder="crm-aziz.vercel.app"
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              <Text style={styles.inputHeading}>{t(locale, 'port')}</Text>
              <TextInput
                style={styles.authInput}
                value={port}
                onChangeText={setPort}
                placeholder={t(locale, 'portPlaceholder')}
                placeholderTextColor="#475569"
                keyboardType="numeric"
              />
              
              <TouchableOpacity
                style={styles.authSaveBtn}
                onPress={async () => {
                  try {
                    await AsyncStorage.setItem('@server_ip', serverIp);
                    await AsyncStorage.setItem('@server_port', port);
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setShowSettings(false);
                  } catch {
                    showAlert(t(locale, 'loginError'), t(locale, 'saveSettingsError'));
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.authSaveBtnText}>{t(locale, 'save')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.glassAuthCard}>
              <Text style={styles.authCardTitle}>{t(locale, 'signIn')}</Text>
              
              <View style={styles.authInputGroup}>
                <User color="#475569" size={18} style={styles.authInputIcon} />
                <TextInput
                  style={styles.authTextInput}
                  value={username}
                  onChangeText={setUsername}
                  placeholder={t(locale, 'login')}
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.authInputGroup}>
                <Lock color="#475569" size={18} style={styles.authInputIcon} />
                <TextInput
                  style={styles.authTextInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t(locale, 'password')}
                  placeholderTextColor="#475569"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              
              <TouchableOpacity style={styles.authLoginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.authLoginBtnText}>{t(locale, 'signIn')}</Text>}
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
    { id: 'profile' as const, label: 'Профиль', Icon: UserCircle, count: 0 },
  ];

  return (
    <SafeAreaView style={styles.layoutMainContainer} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {activeTab !== 'profile' && (
        <View style={styles.topProfileBar}>
          <View style={styles.driverMetaBlock}>
            <Text style={styles.driverWelcome}>{driver!.name}</Text>
            <View style={styles.driverPlateBadgeContainer}>
              <Car size={13} color="#4F46E5" />
              <Text style={styles.driverPlateText}>{driver!.vehiclePlate}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.refreshIconButton} onPress={() => { fetchOrders(true); }} activeOpacity={0.7}>
            <RefreshCw size={16} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      )}

      {activeTab !== 'profile' && (
        <View style={isTrackingGps ? styles.gpsActiveIndicator : styles.gpsInactiveIndicator}>
          <View style={styles.gpsPulseBox}>
            {isTrackingGps ? (
              <Animated.View style={[styles.gpsPulseRing, { opacity: pulseAnim }]} />
            ) : null}
            <View style={[styles.gpsPulseDot, { backgroundColor: isTrackingGps ? '#10B981' : '#94A3B8' }]} />
          </View>
          <Navigation size={13} color={isTrackingGps ? '#065F46' : '#64748B'} style={{ marginRight: 6 }} />
          <Text style={isTrackingGps ? styles.gpsActiveText : styles.gpsInactiveText}>
            {isTrackingGps ? t(locale, 'gpsTracking') : t(locale, 'gpsIdle')}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.layoutMainScroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          activeTab !== 'profile'
            ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            : undefined
        }
      >
        {loading && activeTab !== 'profile' ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 60 }} />
        ) : activeTab === 'home' ? (
          <View style={{ flex: 1 }}>
            {/* Earnings metric card */}
            <View style={styles.todayEarningsCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.earningsIconBg}>
                  <TrendingUp size={18} color="#10B981" />
                </View>
                <Text style={styles.earningsTitleText}>Заработано сегодня</Text>
              </View>
              <Text style={styles.earningsValueText}>
                {todayEarned.toLocaleString()} {t(locale, 'currency')}
              </Text>
            </View>

            <View style={{ paddingHorizontal: 20 }}>
              {(() => {
                const homeOrders = activeOrders;

                // 1. Overdue orders: status === 'container_placed' and elapsed time > 2 hours
                const overdueContainers = homeOrders.filter(o => {
                  if (o.status !== 'container_placed') return false;
                  const start = new Date(o.updatedAt).getTime();
                  if (isNaN(start)) return false;
                  return (Date.now() - start) >= 2 * 60 * 60 * 1000;
                });

                // 2. Placed containers (active): status === 'container_placed' and elapsed time <= 2 hours
                const activeContainers = homeOrders.filter(o => {
                  if (o.status !== 'container_placed') return false;
                  const start = new Date(o.updatedAt).getTime();
                  if (isNaN(start)) return false;
                  return (Date.now() - start) < 2 * 60 * 60 * 1000;
                });

                // 3. New orders: status === 'new'
                const newOrders = homeOrders.filter(o => o.status === 'new');

                // 4. Assigned orders: status === 'assigned'
                const assignedOrders = homeOrders.filter(o => o.status === 'assigned');

                // 5. Active trip order (currently in progress or picked up, or earliest assigned if no trip in progress)
                const activeTripOrder = homeOrders.find(o => o.status === 'in_progress' || o.status === 'picked_up') 
                  || (assignedOrders.length > 0 ? assignedOrders.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0] : null);

                // Other next orders: assignedOrders minus activeTripOrder
                const nextOrders = assignedOrders.filter(o => o.id !== activeTripOrder?.id);

                const hasAnyOrders = overdueContainers.length > 0 || activeTripOrder != null || activeContainers.length > 0 || newOrders.length > 0;

                if (!hasAnyOrders) {
                  return (
                    <View style={styles.emptyFeedPlaceholder}>
                      <CheckCircle size={52} color="#10B981" />
                      <Text style={styles.emptyFeedTitle}>{t(locale, 'allDone')}</Text>
                      <Text style={styles.emptyFeedSub}>{t(locale, 'allDoneSub')}</Text>
                    </View>
                  );
                }

                return (
                  <View style={{ gap: 16 }}>
                    {/* SECTION 1: Overdue Containers */}
                    {overdueContainers.length > 0 && (
                      <View style={{ marginBottom: 16, backgroundColor: '#FEF2F2', borderRadius: 20, borderWidth: 1, borderColor: '#FEE2E2', overflow: 'hidden' }}>
                        <TouchableOpacity 
                          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 16, backgroundColor: '#FEE2E2' }}
                          onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setIsOverdueExpanded(!isOverdueExpanded);
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Text style={{ fontSize: 16, color: '#EF4444' }}>⚠️</Text>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#991B1B' }}>
                              Просроченные контейнеры ({overdueContainers.length})
                            </Text>
                          </View>
                          <ChevronDown 
                            size={18} 
                            color="#991B1B" 
                            style={{ transform: [{ rotate: isOverdueExpanded ? '180deg' : '0deg' }] }} 
                          />
                        </TouchableOpacity>

                        {isOverdueExpanded && (
                          <View style={{ padding: 16, gap: 12 }}>
                            {overdueContainers.map((o) => renderCompactCard(o))}
                          </View>
                        )}
                      </View>
                    )}

                    {/* SECTION 2: Active Trip In Progress */}
                    {activeTripOrder && (
                      <View style={{ marginTop: 6 }}>
                        <Text style={styles.feedSectionHeading}>Сейчас в работе / Hozir ishda</Text>
                        <View style={styles.focusedOrderContainer}>
                          <View style={styles.focusedOrderHeader}>
                            <Text style={styles.focusedOrderLabel}>
                              {activeTripOrder.status === 'in_progress' ? 'Активный рейс (В пути)' : 'Активный рейс (Назначен)'}
                            </Text>
                            {renderStatusBadge(activeTripOrder.status)}
                          </View>
                          
                          {renderStepProgress(activeTripOrder.status)}

                          <View style={styles.focusedOrderScheduleBlock}>
                            <Text style={styles.focusedOrderScheduleLabel}>{t(locale, 'scheduledAt')}</Text>
                            <Text style={styles.focusedOrderTimeText}>{formatDate(activeTripOrder.scheduledAt)}</Text>
                          </View>

                          <Text style={styles.focusedOrderAddress}>{formatAddressDisplay(activeTripOrder.address, locale)}</Text>

                          <TouchableOpacity style={styles.focusedOrderNavBtn} onPress={() => openNavigation(activeTripOrder)} activeOpacity={0.8}>
                            <Navigation size={14} color="#FFFFFF" />
                            <Text style={styles.focusedOrderNavBtnText}>Открыть навигатор</Text>
                          </TouchableOpacity>

                          <View style={styles.focusedOrderGridDetails}>
                            <View style={styles.focusedDetailBadge}>
                              <PaymentTypeIcon type={activeTripOrder.paymentType} size={14} color="#475569" />
                              <Text style={styles.focusedDetailBadgeText}>
                                {getPaymentLabel(locale, activeTripOrder.paymentType)}: {activeTripOrder.paymentAmount.toLocaleString()} {t(locale, 'currency')}
                              </Text>
                            </View>
                            <View style={styles.focusedDetailBadge}>
                              <Warehouse size={14} color="#475569" />
                              <Text style={styles.focusedDetailBadgeText}>Размер: {activeTripOrder.containerSizeM3} m³</Text>
                            </View>
                          </View>

                          <View style={styles.focusedOrderClientBox}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.focusedClientLabel}>Клиент</Text>
                              <Text style={styles.focusedClientName}>{activeTripOrder.clientName}</Text>
                            </View>
                            <TouchableOpacity style={styles.focusedClientCallBtn} onPress={() => callClient(activeTripOrder.clientPhone)} activeOpacity={0.8}>
                              <Phone size={16} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>

                          {activeTripOrder.status === 'new' && (
                            <Text style={styles.focusedOrderHint}>{t(locale, 'acceptAnytimeHint')}</Text>
                          )}
                          {activeTripOrder.status === 'assigned' && (
                            <Text style={styles.focusedOrderHint}>{t(locale, 'earlyTripHint')}</Text>
                          )}

                          <Text style={styles.focusedOrderWhatToDo}>{t(locale, 'whatToDo')}</Text>
                          {renderPrimaryButton(activeTripOrder, true)}

                          <TouchableOpacity style={styles.focusedOrderLinkBtn} onPress={() => openOrder(activeTripOrder)} activeOpacity={0.7}>
                            <Text style={styles.focusedOrderLinkText}>{t(locale, 'openOrder')}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* SECTION 3: Active Placed Containers */}
                    {activeContainers.length > 0 && (
                      <View>
                        <Text style={[styles.feedSectionHeading, { color: '#F59E0B' }]}>
                          📦 Установленные контейнеры (активные)
                        </Text>
                        {activeContainers.map((o) => renderCompactCard(o))}
                      </View>
                    )}

                    {/* SECTION 4: New/Incoming Orders */}
                    {newOrders.length > 0 && (
                      <View>
                        <Text style={[styles.feedSectionHeading, { color: '#3B82F6' }]}>
                          🆕 Новые заказы
                        </Text>
                        {newOrders.map((o) => renderCompactCard(o))}
                      </View>
                    )}

                    {/* SECTION 5: Next Scheduled Orders */}
                    {nextOrders.length > 0 && (
                      <View>
                        <Text style={styles.feedSectionHeading}>📋 Следующие заказы</Text>
                        {nextOrders.map((o, idx) => renderCompactCard(o, idx + 2))}
                      </View>
                    )}
                  </View>
                );
              })()}
            </View>
          </View>
        ) : activeTab === 'calendar' ? (
          <View style={[styles.calendarGridPanel]}>
            {/* Calendar Grid Header: Prev, Month name, Сегодня, Next */}
            <View style={styles.calendarGridHeader}>
              <TouchableOpacity style={styles.calendarGridHeaderBtn} onPress={() => shiftMonth(-1)} activeOpacity={0.7}>
                <ChevronLeft size={18} color="#0F172A" />
              </TouchableOpacity>
              
              <View style={styles.calendarGridHeaderCenter}>
                <Text style={styles.calendarGridMonthTitle}>{formatMonthYear(locale, displayedMonth)}</Text>
                <TouchableOpacity style={styles.calendarGridTodayBtn} onPress={handleGoToCalendarToday} activeOpacity={0.7}>
                  <Text style={styles.calendarGridTodayBtnText}>{t(locale, 'goToToday')}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.calendarGridHeaderBtn} onPress={() => shiftMonth(1)} activeOpacity={0.7}>
                <ChevronRight size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Weekday Labels (Monday first) */}
            <View style={styles.calendarGridWeekdays}>
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(wd => (
                <Text key={wd} style={styles.calendarGridWeekdayText}>{wd}</Text>
              ))}
            </View>

            {/* Grid layout */}
            <View style={styles.calendarGridContainer}>
              {calendarGridDays.map(({ date, isCurrentMonth, key }) => {
                const selected = isSameDay(date, selectedCalendarDate);
                const isToday = isSameDay(date, new Date());
                
                const dayOrders = orders.filter(o => isSameDay(new Date(o.scheduledAt), date));
                const hasActive = dayOrders.some(o => o.status !== 'completed' && o.status !== 'new');
                const hasNew = dayOrders.some(o => o.status === 'new');
                const hasCompleted = dayOrders.some(o => o.status === 'completed');

                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.calendarGridCell,
                      !isCurrentMonth && styles.calendarGridCellMuted,
                      isToday && !selected && styles.calendarGridCellToday,
                      selected && styles.calendarGridCellSelected,
                    ]}
                    onPress={() => handleSelectCalendarDate(date)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.calendarGridCellDayNum,
                      !isCurrentMonth && styles.calendarGridCellDayNumMuted,
                      selected && styles.calendarGridCellDayNumSelected,
                    ]}>
                      {date.getDate()}
                    </Text>
                    
                    {dayOrders.length > 0 ? (
                      <View style={styles.calendarGridCellDotsRow}>
                        {hasActive && <View style={[styles.calendarGridCellDot, { backgroundColor: selected ? '#FFFFFF' : '#F59E0B' }]} />}
                        {hasNew && <View style={[styles.calendarGridCellDot, { backgroundColor: selected ? '#FFFFFF' : '#3B82F6' }]} />}
                        {hasCompleted && <View style={[styles.calendarGridCellDot, { backgroundColor: selected ? '#FFFFFF' : '#10B981' }]} />}
                      </View>
                    ) : (
                      <View style={styles.calendarGridCellDotEmpty} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Daily statistics banner */}
            <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
              {ordersForCalendarDay.length > 0 && (
                <View style={styles.calendarGridStatsRow}>
                  <View style={styles.calendarGridStatCard}>
                    <Text style={styles.calendarGridStatLabel}>Всего</Text>
                    <Text style={styles.calendarGridStatValue}>{calendarDayStats.total}</Text>
                  </View>
                  <View style={styles.calendarGridStatCard}>
                    <Text style={styles.calendarGridStatLabel}>В работе</Text>
                    <Text style={[styles.calendarGridStatValue, { color: '#4F46E5' }]}>{calendarDayStats.active}</Text>
                  </View>
                  <View style={[styles.calendarGridStatCard, styles.calendarGridStatCardDone]}>
                    <Text style={styles.calendarGridStatLabel}>Готово</Text>
                    <Text style={[styles.calendarGridStatValue, { color: '#10B981' }]}>{calendarDayStats.done}</Text>
                  </View>
                </View>
              )}

              <Text style={styles.feedSectionHeading}>
                {formatCalendarDayTitle(locale, selectedCalendarDate)}
              </Text>

              {ordersForCalendarDay.length === 0 ? (
                <View style={styles.calendarGridEmptyFeedCard}>
                  <Clock size={36} color="#CBD5E1" style={{ marginBottom: 12 }} />
                  <Text style={styles.emptyFeedTitle}>{t(locale, 'noOrdersOnDate')}</Text>
                  <Text style={styles.emptyFeedSub}>{formatCalendarDayTitle(locale, selectedCalendarDate)}</Text>
                </View>
              ) : (
                <View style={styles.timelineFeedList}>
                  {ordersForCalendarDay.map((o, idx) => {
                    const time = formatTimeOnly(o.scheduledAt);
                    const { label, color, bg } = getStatusLabel(locale, o.status);
                    const completed = o.status === 'completed';
                    const isLast = idx === ordersForCalendarDay.length - 1;
                    return (
                      <View key={o.id} style={styles.timelineRow}>
                        <View style={styles.timelineTimeCol}>
                          <Text style={styles.timelineTimeText}>{time}</Text>
                        </View>
                        <View style={styles.timelineRailCol}>
                          <View style={[styles.timelineDotIndicator, completed && styles.timelineDotIndicatorDone]} />
                          {!isLast && <View style={styles.timelineRailLine} />}
                        </View>
                        <TouchableOpacity
                          style={[styles.timelineContentCard, completed && styles.timelineContentCardDone]}
                          onPress={() => openOrder(o)}
                          activeOpacity={0.9}
                        >
                          <View style={styles.timelineContentCardHeader}>
                            <Text style={styles.timelineContentCardId}>#{o.id}</Text>
                            <View style={[styles.badgeContainer, styles.badgeContainerCompact, { backgroundColor: bg }]}>
                              <Text style={[styles.badgeTextCompact, { color }]}>{label}</Text>
                            </View>
                          </View>
                          <Text style={styles.timelineContentCardAddress} numberOfLines={2}>
                            {formatAddressDisplay(o.address, locale)}
                          </Text>
                          <Text style={styles.timelineContentCardClient}>{o.clientName}</Text>
                          {o.operatorNote ? (
                            <Text style={styles.timelineContentCardNote} numberOfLines={2}>{o.operatorNote}</Text>
                          ) : null}
                          <View style={styles.timelineContentCardArrowHint}>
                            <Text style={styles.timelineArrowHintText}>{t(locale, 'openOrder')}</Text>
                            <ChevronRight size={12} color="#94A3B8" />
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        ) : activeTab === 'history' ? (
          <View style={{ flex: 1 }}>
            {/* History Section Header */}
            <View style={styles.historySectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.historyHeaderIconWrapper}>
                  <TrendingUp size={20} color="#4F46E5" />
                </View>
                <Text style={styles.historyScreenTitle}>Финансы / Деньги</Text>
              </View>
            </View>

            {/* Today's earnings breakdown metrics */}
            {(() => {
              const todayOrders = historyOrders.filter(o => isSameDay(new Date(o.scheduledAt), new Date()));
              const todayCash = todayOrders.filter(o => o.paymentType === 'cash').reduce((s, o) => s + (o.paymentAmount || 0), 0);
              const todayBeznal = todayOrders.filter(o => o.paymentType === 'card' || o.paymentType === 'online').reduce((s, o) => s + (o.paymentAmount || 0), 0);

              return (
                <View style={[styles.todayEarningsCard, { flexDirection: 'column', alignItems: 'stretch', marginHorizontal: 20, marginBottom: 12, backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>Сводка за сегодня</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#10B981' }}>{(todayCash + todayBeznal).toLocaleString()} ₽</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 12 }}>
                    <View style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                      <Text style={{ fontSize: 11, color: '#64748B' }}>Наличные (Naqd)</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A', marginTop: 2 }}>{todayCash.toLocaleString()} ₽</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                      <Text style={{ fontSize: 11, color: '#64748B' }}>Безналичный (Naqdsiz)</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#3B82F6', marginTop: 2 }}>{todayBeznal.toLocaleString()} ₽</Text>
                    </View>
                  </View>
                </View>
              );
            })()}

            {/* Filter Selector Switcher */}
            <View style={styles.filterBarContainer}>
              {(['day', 'week', 'month'] as const).map(filter => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterBarBtn,
                    historyFilter === filter && styles.filterBarBtnActive
                  ]}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setHistoryFilter(filter);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.filterBarBtnText,
                    historyFilter === filter && styles.filterBarBtnTextActive
                  ]}>
                    {filter === 'day' ? 'День' : filter === 'week' ? 'Неделя' : 'Месяц'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Chart Area */}
            <View style={styles.historyChartContainer}>
              <TouchableOpacity style={styles.chartArrowNavBtn} onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setHistoryOffset(o => o + 1);
              }} activeOpacity={0.7}>
                <ChevronLeft size={18} color="#0F172A" />
              </TouchableOpacity>

              <View style={styles.chartColumnsWrapper}>
                {historyChartData.map((data, index) => {
                  const isSelected = selectedHistoryIndex === index;
                  const maxAmount = Math.max(...historyChartData.map(d => d.totalAmount), 1);
                  const barMaxHeight = 100;
                  const barHeight = Math.max((data.totalAmount / maxAmount) * barMaxHeight, 6);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.chartColumnItem}
                      onPress={() => setSelectedHistoryIndex(index)}
                      activeOpacity={0.85}
                    >
                      <Text 
                        style={[styles.chartColumnValueText, isSelected && styles.chartColumnValueTextActive]} 
                        numberOfLines={1} 
                        adjustsFontSizeToFit
                      >
                        {data.totalAmount > 0 ? `${(data.totalAmount / 1000).toFixed(0)}k` : ''}
                      </Text>
                      <View style={[
                        styles.chartColumnBar,
                        { height: barHeight },
                        isSelected && styles.chartColumnBarActive
                      ]} />
                      <Text style={[styles.chartColumnLabelText, isSelected && styles.chartColumnLabelTextActive]}>
                        {data.label.replace('\n', ' ')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity 
                disabled={historyOffset === 0} 
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setHistoryOffset(o => Math.max(0, o - 1));
                }} 
                style={[styles.chartArrowNavBtn, historyOffset === 0 && { opacity: 0.3 }]}
                activeOpacity={0.7}
              >
                <ChevronRight size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Selected Period Details */}
            {selectedHistoryIndex !== null && historyChartData[selectedHistoryIndex] && (() => {
              const period = historyChartData[selectedHistoryIndex];
              const periodOrders = historyOrders.filter(o => {
                const t = new Date(o.scheduledAt).getTime();
                return t >= period.dateStart.getTime() && t < period.dateEnd.getTime();
              });
              const periodCash = periodOrders.filter(o => o.paymentType === 'cash').reduce((s, o) => s + (o.paymentAmount || 0), 0);
              const periodBeznal = periodOrders.filter(o => o.paymentType === 'card' || o.paymentType === 'online').reduce((s, o) => s + (o.paymentAmount || 0), 0);

              return (
                <View style={[styles.historySummaryPeriodCard, { flexDirection: 'column', gap: 12, alignItems: 'stretch' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={styles.historySummaryTitle}>{period.fullLabel}</Text>
                      <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                        Выполнено заказов: <Text style={{ fontWeight: '600', color: '#0F172A' }}>{period.orderCount}</Text>
                      </Text>
                    </View>
                    <Text style={styles.historySummaryValueText}>{period.totalAmount.toLocaleString()} ₽</Text>
                  </View>

                  <View style={{ height: 1, backgroundColor: '#E2E8F0' }} />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
                      <Text style={{ fontSize: 12, color: '#64748B' }}>Наличными:</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>{periodCash.toLocaleString()} ₽</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6' }} />
                      <Text style={{ fontSize: 12, color: '#64748B' }}>Безналичными:</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>{periodBeznal.toLocaleString()} ₽</Text>
                    </View>
                  </View>
                </View>
              );
            })()}

            {/* Completed list under chart */}
            <View style={{ paddingBottom: 32, marginTop: 16, paddingHorizontal: 20 }}>
              <Text style={styles.feedSectionHeading}>Заказы за период / Buyurtmalar ro'yxati</Text>
              {historyOrders
                .filter(o => {
                  if (selectedHistoryIndex === null || !historyChartData[selectedHistoryIndex]) return false;
                  const t = new Date(o.scheduledAt).getTime();
                  return t >= historyChartData[selectedHistoryIndex].dateStart.getTime() && t < historyChartData[selectedHistoryIndex].dateEnd.getTime();
                })
                .map((o) => renderCompactCard(o, undefined, true))}
            </View>
          </View>
        ) : activeTab === 'profile' ? (
          <View style={{ flex: 1 }}>
            {/* Profile Avatar & Hero Section */}
            <View style={styles.profileSheetHeroCard}>
              <View style={styles.profileAvatarIconContainer}>
                <View style={styles.profileAvatarIconCirc}>
                  <LucideUser size={40} color="#FFFFFF" />
                </View>
                <View style={styles.profileActiveGpsIndicatorBorder}>
                  <View style={[
                    styles.profileActiveGpsIndicatorInner,
                    { backgroundColor: isTrackingGps ? '#10B981' : '#94A3B8' }
                  ]} />
                </View>
              </View>
              
              <Text style={styles.profileSheetDriverName}>{driver!.name}</Text>
              
              <View style={styles.profileSheetPlateBadge}>
                <Car size={13} color="#4F46E5" />
                <Text style={styles.profileSheetPlateText}>{driver!.vehiclePlate}</Text>
              </View>
              
              <Text style={styles.profileSheetGpsStatusMessage}>
                {isTrackingGps ? '🟢 Геолокация активна' : '⚪ Геолокация выкл.'}
              </Text>
            </View>

            {/* Metrics cards grid */}
            <View style={styles.profileMetricsRowContainer}>
              <View style={styles.profileMetricCardItem}>
                <PackageCheck size={20} color="#4F46E5" style={{ marginBottom: 4 }} />
                <Text style={styles.profileMetricValueText}>{historyOrders.length}</Text>
                <Text style={styles.profileMetricLabelText}>Выполнено</Text>
              </View>
              
              <View style={styles.profileMetricCardItem}>
                <TrendingUp size={20} color="#10B981" style={{ marginBottom: 4 }} />
                <Text style={[styles.profileMetricValueText, { color: '#10B981' }]}>
                  {historyOrders.reduce((s, o) => s + (Number(o.driverFee) || 0), 0).toLocaleString()}
                </Text>
                <Text style={styles.profileMetricLabelText}>Всего руб.</Text>
              </View>
              
              <View style={styles.profileMetricCardItem}>
                <ClipboardList size={20} color="#F59E0B" style={{ marginBottom: 4 }} />
                <Text style={[styles.profileMetricValueText, { color: '#F59E0B' }]}>{activeOrders.length}</Text>
                <Text style={styles.profileMetricLabelText}>Активных</Text>
              </View>
            </View>

            {/* Income today metric banner */}
            <View style={styles.profileTodayIncomeMetricCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileTodayIncomeLabel}>Заработано сегодня</Text>
                <Text style={styles.profileTodayIncomeValue}>{todayEarned.toLocaleString()} руб.</Text>
              </View>
              <Banknote size={32} color="#10B981" />
            </View>

            {/* System Settings Options */}
            <View style={styles.profileActionsListContainer}>
              <TouchableOpacity
                style={styles.profileActionListItem}
                onPress={() => { fetchOrders(true); }}
                activeOpacity={0.85}
              >
                <View style={[styles.profileActionListItemIconBg, { backgroundColor: '#EEF2FF' }]}>
                  <RefreshCw size={18} color="#4F46E5" />
                </View>
                <Text style={styles.profileActionListItemText}>Обновить заказы</Text>
                <ChevronRight size={16} color="#CBD5E1" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.profileActionListItem, { borderColor: '#FEE2E2' }]}
                onPress={async () => { await clearSession(); }}
                activeOpacity={0.85}
              >
                <View style={[styles.profileActionListItemIconBg, { backgroundColor: '#FEE2E2' }]}>
                  <LogOut size={18} color="#EF4444" />
                </View>
                <Text style={[styles.profileActionListItemText, { color: '#EF4444' }]}>Выйти из аккаунта</Text>
                <ChevronRight size={16} color="#FCA5A5" />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Modern sliding Bottom TabBar */}
      <View style={[styles.bottomTabBarPanel, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {bottomTabs.map(({ id, label, Icon, count }) => (
          <TouchableOpacity
            key={id}
            style={styles.bottomTabBarItem}
            onPress={() => {
              if (id === 'calendar') {
                handleGoToCalendarToday();
              }
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setActiveTab(id);
            }}
            activeOpacity={0.8}
          >
            <Icon size={20} color={activeTab === id ? '#4F46E5' : '#94A3B8'} />
            <Text style={[styles.bottomTabBarLabelText, activeTab === id && styles.bottomTabBarLabelTextActive]}>{label}</Text>
            {count > 0 ? (
              <View style={styles.bottomTabBarItemBadge}>
                <Text style={styles.bottomTabBarItemBadgeText}>{count > 9 ? '9+' : count}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      {/* Slide-Up Bottom Sheet Detail Dialog */}
      {selectedOrder && (() => {
        const order = selectedOrder;
        const isUpdating = updatingOrderId === order.id;
        return (
          <Modal animationType="slide" transparent visible onRequestClose={() => setSelectedOrder(null)}>
            <Pressable style={styles.sheetOverlayContainer} onPress={() => setSelectedOrder(null)}>
              <Pressable style={styles.sheetContentContainer} onPress={e => e.stopPropagation()}>
                <View style={styles.sheetDragBarHandle} />
                
                <View style={styles.sheetHeaderBar}>
                  <TouchableOpacity onPress={() => { setSelectedOrder(null); }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <X size={24} color="#0F172A" />
                  </TouchableOpacity>
                  <Text style={styles.sheetHeaderTitle}>Заказ #{order.id}</Text>
                </View>

                <ScrollView style={styles.sheetScrollFlexBody} contentContainerStyle={{ paddingBottom: 28, paddingHorizontal: 20 }}>
                  <View style={styles.sheetStatusBadgeBlock}>
                    {renderStatusBadge(order.status)}
                    <Text style={styles.sheetInlineOrderIdText}>#{order.id}</Text>
                  </View>
                  
                  {renderStepProgress(order.status)}
                  
                  <Text style={styles.sheetHeadingLabel}>{t(locale, 'scheduledAt')}</Text>
                  <Text style={styles.sheetBigTimeText}>{formatDate(order.scheduledAt)}</Text>
                  
                  {order.status === 'assigned' && (
                    <Text style={styles.sheetInfoHintCard}>{t(locale, 'earlyTripHint')}</Text>
                  )}
                  {order.status === 'new' && queueActionMode(order, focusOrder) === 'accept_only' && (
                    <Text style={styles.sheetInfoHintCard}>{t(locale, 'acceptAnytimeHint')}</Text>
                  )}
                  {queueActionMode(order, focusOrder) === 'locked' && (
                    <Text style={styles.sheetWarningHintCard}>{t(locale, 'finishCurrentFirst')}</Text>
                  )}
                  
                  <Text style={styles.sheetBigAddressText}>{formatAddressDisplay(order.address, locale)}</Text>
                  
                  <TouchableOpacity style={styles.sheetMapsNavigationBtn} onPress={() => openNavigation(order)} activeOpacity={0.85}>
                    <Navigation size={14} color="#FFFFFF" />
                    <Text style={styles.sheetMapsNavigationBtnText}>Навигация (открыть карту)</Text>
                  </TouchableOpacity>

                  {order.containerNumber ? (
                    <View style={styles.sheetContainerNumBadge}>
                      <Text style={styles.sheetContainerNumBadgeText}>📦 Контейнер: #{order.containerNumber}</Text>
                    </View>
                  ) : null}
                  
                  <Text style={styles.sheetClientNameText}>{order.clientName}</Text>

                  <TouchableOpacity style={styles.sheetCallClientBtn} onPress={() => callClient(order.clientPhone)} activeOpacity={0.85}>
                    <Phone size={16} color="#059669" />
                    <Text style={styles.sheetCallClientBtnText}>{t(locale, 'callClient')}</Text>
                  </TouchableOpacity>

                  {order.operatorNote ? (
                    <View style={styles.sheetOperatorNoteBox}>
                      <Text style={styles.sheetOperatorNoteText}>{order.operatorNote}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity style={styles.sheetDetailsToggleButton} onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setShowOrderDetails(v => !v);
                  }} activeOpacity={0.8}>
                    <Text style={styles.sheetDetailsToggleButtonText}>
                      {showOrderDetails ? t(locale, 'hideDetails') : t(locale, 'showDetails')}
                    </Text>
                  </TouchableOpacity>

                  {showOrderDetails && (
                    <View style={styles.sheetHiddenDetailsBlock}>
                      <Text style={styles.sheetHiddenDetailsLineText}>
                        {t(locale, 'container')}: {order.containerSizeM3} m³
                      </Text>
                      <Text style={styles.sheetHiddenDetailsLineText}>
                        {t(locale, 'duration')}: {getRentalLabel(locale, order.rentalDuration)}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <PaymentTypeIcon type={order.paymentType} size={14} color="#475569" />
                        <Text style={[styles.sheetHiddenDetailsLineText, { marginTop: 0 }]}>
                          Оплата: {order.paymentAmount.toLocaleString()} {t(locale, 'currency')} · {getPaymentLabel(locale, order.paymentType)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {order.status === 'in_progress' && canRunWorkflowOnOrder(order, focusOrder) && (
                    <TouchableOpacity
                      style={styles.sheetSkipToPickedUpLink}
                      disabled={isUpdating}
                      onPress={() => { handleUpdateStatus(order.id, 'picked_up'); }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.sheetSkipToPickedUpLinkText}>{t(locale, 'pickUpNow')}</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>

                {order.status !== 'completed' && (
                  <View style={styles.sheetFooterBlock}>
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

      {/* Navigation App Selector Modal */}
      <Modal animationType="fade" transparent visible={!!navModalOrder} onRequestClose={() => setNavModalOrder(null)}>
        <Pressable style={styles.alertOverlay} onPress={() => setNavModalOrder(null)}>
          <View style={[styles.alertBox, { padding: 0, overflow: 'hidden' }]} onStartShouldSetResponder={() => true}>
            <View style={styles.mapSelectorHeader}>
              <Navigation size={28} color="#4F46E5" style={{ marginBottom: 12 }} />
              <Text style={styles.mapSelectorTitle}>Выберите карту</Text>
            </View>
            <View style={{ width: '100%', padding: 18, gap: 12 }}>
              <TouchableOpacity style={[styles.alertBtn, { backgroundColor: '#FCD34D', flexDirection: 'row', justifyContent: 'center', gap: 8 }]} onPress={() => navModalOrder && openMapApp('yandex', navModalOrder)} activeOpacity={0.85}>
                <MapPin size={18} color="#92400E" />
                <Text style={[styles.alertBtnText, { color: '#92400E' }]}>Yandex Maps</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.alertBtn, { backgroundColor: '#3B82F6', flexDirection: 'row', justifyContent: 'center', gap: 8 }]} onPress={() => navModalOrder && openMapApp('google', navModalOrder)} activeOpacity={0.85}>
                <MapPin size={18} color="#FFFFFF" />
                <Text style={styles.alertBtnText}>Google Maps</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.alertBtn, styles.alertBtnSecondary, { marginTop: 4 }]} onPress={() => setNavModalOrder(null)} activeOpacity={0.85}>
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
  // ─── Custom Global Premium variables & styles ──────────────────
  layoutMainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  layoutMainScroll: {
    flex: 1,
  },
  darkAuthContainer: {
    flex: 1,
    backgroundColor: '#0B0F19',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  authScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  authTopBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
  },
  authSettingsBtn: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 18,
    letterSpacing: 0.5,
  },
  brandSubTitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  glassAuthCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1F2937',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 6,
  },
  authCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  inputHeading: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  authInput: {
    backgroundColor: '#030712',
    borderColor: '#1F2937',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    color: '#FFFFFF',
    marginBottom: 16,
    fontSize: 15,
    fontWeight: '600',
  },
  authSaveBtn: {
    backgroundColor: '#4F46E5',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  authSaveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  authInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#030712',
    borderColor: '#1F2937',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 54,
  },
  authInputIcon: {
    marginRight: 12,
  },
  authTextInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
  },
  authLoginBtn: {
    backgroundColor: '#4F46E5',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  authLoginBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  topProfileBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  driverMetaBlock: {
    flex: 1,
  },
  driverWelcome: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  driverPlateBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  driverPlateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  refreshIconButton: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gpsActiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
  },
  gpsInactiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  gpsPulseBox: {
    height: 12,
    width: 12,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsPulseRing: {
    position: 'absolute',
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: '#34D399',
  },
  gpsPulseDot: {
    height: 6,
    width: 6,
    borderRadius: 3,
  },
  gpsActiveText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '700',
    flex: 1,
  },
  gpsInactiveText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    flex: 1,
  },
  todayEarningsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
  },
  earningsIconBg: {
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 10,
  },
  earningsTitleText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '700',
  },
  earningsValueText: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: '800',
  },
  focusedOrderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  focusedOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  focusedOrderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  focusedOrderScheduleBlock: {
    marginTop: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  focusedOrderScheduleLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  focusedOrderTimeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  focusedOrderAddress: {
    fontSize: 18,
    color: '#0F172A',
    marginTop: 14,
    lineHeight: 25,
    fontWeight: '800',
  },
  focusedOrderNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  focusedOrderNavBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  focusedOrderGridDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  focusedDetailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  focusedDetailBadgeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
  },
  focusedOrderClientBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  focusedClientLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  focusedClientName: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
    marginTop: 2,
  },
  focusedClientCallBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusedOrderHint: {
    fontSize: 12,
    color: '#0369A1',
    backgroundColor: '#E0F2FE',
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  focusedOrderWhatToDo: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  focusedOrderLinkBtn: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 4,
  },
  focusedOrderLinkText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyFeedPlaceholder: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyFeedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#475569',
    marginTop: 14,
  },
  emptyFeedSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  feedSectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 12,
    marginTop: 18,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  feedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
  },
  feedCardActive: {
    borderColor: '#4F46E5',
    borderWidth: 1.5,
  },
  feedCardTapArea: {
    padding: 16,
  },
  feedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedCardId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  feedCardBody: {
    marginTop: 10,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoTimeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  infoAddressText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  feedCardSeparator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  feedCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedCardClient: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paymentBadgeText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
  },
  feedCardActionBlock: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cardActionBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  cardActionBtnLocked: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardActionBtnLockedText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonLarge: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  actionButtonLargeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  payLockWrapperCompact: {
    paddingTop: 4,
  },
  payLockWrapperLarge: {
    marginTop: 8,
  },
  payLockText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
  },
  payOptionBlockCompact: {
    paddingTop: 4,
  },
  payOptionBlockLarge: {
    marginTop: 8,
  },
  paidBadgeBanner: {
    backgroundColor: '#10B981',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  paidBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  payHintText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeContainerCompact: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextCompact: {
    fontSize: 9,
  },
  stepProgressWrapper: {
    position: 'relative',
    marginVertical: 14,
    paddingHorizontal: 8,
  },
  stepTrackBackground: {
    position: 'absolute',
    top: 14,
    left: '12%',
    right: '12%',
    height: 2,
    backgroundColor: '#F1F5F9',
    zIndex: 1,
  },
  stepTrackActive: {
    position: 'absolute',
    top: 14,
    left: '12%',
    height: 2,
    backgroundColor: '#4F46E5',
    zIndex: 1,
  },
  stepItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepItemBox: {
    flex: 1,
    alignItems: 'center',
    zIndex: 2,
  },
  stepDotCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepDotCircleDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepDotCircleActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  stepDotNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  stepDotNumberTextActive: {
    color: '#FFFFFF',
  },
  stepDotLabelText: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'center',
  },
  stepDotLabelTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  timelineFeedList: {
    paddingBottom: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineTimeCol: {
    width: 56,
    paddingTop: 16,
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  timelineTimeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4F46E5',
  },
  timelineRailCol: {
    width: 16,
    alignItems: 'center',
    paddingTop: 18,
  },
  timelineDotIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4F46E5',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 1,
  },
  timelineDotIndicatorDone: {
    backgroundColor: '#10B981',
  },
  timelineRailLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: '#E2E8F0',
    marginTop: 2,
    marginBottom: -12,
    minHeight: 28,
  },
  timelineContentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginLeft: 8,
  },
  timelineContentCardDone: {
    opacity: 0.8,
    backgroundColor: '#F8FAFC',
  },
  timelineContentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timelineContentCardId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  timelineContentCardAddress: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  timelineContentCardClient: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  timelineContentCardNote: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 6,
    fontStyle: 'italic',
    backgroundColor: '#FFFBEB',
    padding: 6,
    borderRadius: 6,
  },
  timelineContentCardArrowHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 2,
  },
  timelineArrowHintText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  historyHeaderIconWrapper: {
    backgroundColor: '#EEF2FF',
    padding: 8,
    borderRadius: 10,
  },
  historyScreenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  filterBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterBarBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterBarBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  filterBarBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterBarBtnTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  historyChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chartArrowNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chartColumnsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    flex: 1,
    paddingHorizontal: 8,
  },
  chartColumnItem: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartColumnValueText: {
    fontSize: 8,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '700',
    textAlign: 'center',
  },
  chartColumnValueTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  chartColumnBar: {
    width: '60%',
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
  },
  chartColumnBarActive: {
    backgroundColor: '#4F46E5',
  },
  chartColumnLabelText: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
  chartColumnLabelTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  historySummaryPeriodCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historySummaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  historySummaryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  historySummaryCountBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historySummaryCountBadgeText: {
    fontSize: 9,
    color: '#4F46E5',
    fontWeight: '700',
  },
  historySummaryValueText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
  },
  profileSheetHeroCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
  },
  profileAvatarIconContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileAvatarIconCirc: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileActiveGpsIndicatorBorder: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileActiveGpsIndicatorInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  profileSheetDriverName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  profileSheetPlateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileSheetPlateText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  profileSheetGpsStatusMessage: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 10,
    fontWeight: '600',
  },
  profileMetricsRowContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    gap: 8,
  },
  profileMetricCardItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 2,
  },
  profileMetricValueText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileMetricLabelText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  profileTodayIncomeMetricCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  profileTodayIncomeLabel: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  profileTodayIncomeValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  profileActionsListContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 8,
  },
  profileActionListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  profileActionListItemIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileActionListItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  bottomTabBarPanel: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  bottomTabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  bottomTabBarLabelText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '700',
  },
  bottomTabBarLabelTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  bottomTabBarItemBadge: {
    position: 'absolute',
    top: 0,
    right: '22%',
    backgroundColor: '#EF4444',
    borderRadius: 6,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  bottomTabBarItemBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  sheetOverlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetContentContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '55%',
    flexDirection: 'column',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  sheetDragBarHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  sheetHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  sheetScrollFlexBody: {
    flexShrink: 1,
    flexGrow: 1,
  },
  sheetStatusBadgeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetInlineOrderIdText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  sheetHeadingLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 10,
    textTransform: 'uppercase',
  },
  sheetBigTimeText: {
    fontSize: 15,
    color: '#4F46E5',
    fontWeight: '800',
    marginTop: 2,
  },
  sheetInfoHintCard: {
    fontSize: 12,
    color: '#0369A1',
    backgroundColor: '#E0F2FE',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    lineHeight: 16,
    fontWeight: '600',
  },
  sheetWarningHintCard: {
    fontSize: 12,
    color: '#B45309',
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    lineHeight: 16,
    fontWeight: '600',
  },
  sheetBigAddressText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
    lineHeight: 26,
  },
  sheetMapsNavigationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sheetMapsNavigationBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sheetContainerNumBadge: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sheetContainerNumBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  sheetClientNameText: {
    fontSize: 15,
    color: '#475569',
    marginTop: 10,
    fontWeight: '700',
  },
  sheetCallClientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  sheetCallClientBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  sheetOperatorNoteBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  sheetOperatorNoteText: {
    fontSize: 13,
    color: '#B45309',
    lineHeight: 18,
    fontWeight: '600',
  },
  sheetDetailsToggleButton: {
    marginTop: 16,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sheetDetailsToggleButtonText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
    textAlign: 'center',
  },
  sheetHiddenDetailsBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sheetHiddenDetailsLineText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  sheetSkipToPickedUpLink: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sheetSkipToPickedUpLinkText: {
    fontSize: 13,
    color: '#0D9488',
    fontWeight: '700',
  },
  sheetFooterBlock: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  mapSelectorHeader: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  mapSelectorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },

  // ─── Monthly Grid Calendar Styles ──────────────────────────────
  calendarGridPanel: {
    paddingTop: 12,
  },
  calendarGridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  calendarGridHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarGridHeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },
  calendarGridMonthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'capitalize',
  },
  calendarGridTodayBtn: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  calendarGridTodayBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  calendarGridWeekdays: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  calendarGridWeekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  calendarGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 4,
  },
  calendarGridCell: {
    width: `${(100 - 6 * 1.5) / 7}%`, // dynamic 7 columns
    aspectRatio: 1.05,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  calendarGridCellMuted: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F8FAFC',
    opacity: 0.6,
  },
  calendarGridCellToday: {
    borderColor: '#4F46E5',
    borderWidth: 1.5,
    backgroundColor: '#EEF2FF',
  },
  calendarGridCellSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  calendarGridCellDayNum: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  calendarGridCellDayNumMuted: {
    color: '#CBD5E1',
    fontWeight: '500',
  },
  calendarGridCellDayNumSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  calendarGridCellDotsRow: {
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 5,
  },
  calendarGridCellDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  calendarGridCellDotEmpty: {
    height: 4,
    marginTop: 4,
  },
  calendarGridStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  calendarGridStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calendarGridStatCardDone: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  calendarGridStatLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  calendarGridStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  calendarGridEmptyFeedCard: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // ─── Alert Modal Styles ──────────────────────────────────────────
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  alertBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 20,
  },
  alertBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  alertBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  alertBtnSecondary: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  alertBtnTextSecondary: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
  },
});
