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

function getBatteryOptimizationKey(locale: Locale): TranslationKey | null {
  if (Platform.OS !== 'android') return null;
  const brand = (Device.manufacturer || Device.brand || '').toLowerCase();
  if (brand.includes('xiaomi') || brand.includes('redmi') || brand.includes('poco'))
    return 'batteryOptXiaomi';
  if (brand.includes('samsung'))
    return 'batteryOptSamsung';
  if (brand.includes('oppo') || brand.includes('realme') || brand.includes('oneplus'))
    return 'batteryOptOppo';
  if (brand.includes('huawei') || brand.includes('honor'))
    return 'batteryOptHuawei';
  return 'batteryOptGeneric';
}

async function checkLocationServicesEnabled(): Promise<boolean> {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch {
    return true;
  }
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

      const servicesEnabled = await checkLocationServicesEnabled();
      if (!servicesEnabled) {
        showAlert(t(locale, 'gpsServicesTitle'), t(locale, 'gpsServicesMessage'), true);
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
      await AsyncStorage.multiSet([
        ['@driver_data', JSON.stringify(data)],
        ['@session_version', SESSION_VERSION],
        ['@server_ip', serverIp],
        ['@server_port', port],
      ]);

      const servicesOn = await checkLocationServicesEnabled();
      if (!servicesOn) {
        showAlert(t(locale, 'gpsServicesTitle'), t(locale, 'gpsServicesMessage'), true);
      } else {
        const perms = await requestFullLocationAccess();
        if (!perms.foreground) {
          showAlert(t(locale, 'gpsPermissionTitle'), t(locale, 'gpsPermissionMessage'), true);
        } else if (!perms.background) {
          showAlert(t(locale, 'gpsAlwaysTitle'), t(locale, 'gpsAlwaysMessage'), true);
        } else if (Platform.OS === 'android') {
          const shown = await AsyncStorage.getItem('@battery_opt_shown');
          if (!shown) {
            const key = getBatteryOptimizationKey(locale);
            if (key) {
              await AsyncStorage.setItem('@battery_opt_shown', '1');
              setTimeout(() => {
                showAlert(t(locale, 'batteryOptTitle'), t(locale, key), true);
              }, 500);
            }
          }
        }
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

      if (!response.ok) {
        let errMsg = t(locale, 'statusUpdateError');
        try { const d = await response.json(); if (d?.error) errMsg = d.error; } catch {}
        throw new Error(errMsg);
      }

      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => (prev ? { ...prev, status: newStatus } : null));
      }

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : t(locale, 'statusUpdateError');
      showAlert(t(locale, 'statusUpdateError'), msg);
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
    const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert(
        t(locale, 'cameraPermissionTitle'),
        canAskAgain ? t(locale, 'cameraPermissionMessage') : t(locale, 'cameraPermissionSettings'),
        !canAskAgain,
      );
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
    if (order.paymentStatus !== 'received') {
      showAlert("Ошибка", "Сначала подтвердите получение оплаты перед завершением заказа.");
      return;
    }
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
      <View style={styles.stepRow}>
        {STEP_KEYS.map((key, i) => {
          const stepNum = i + 1;
          const done = stepNum < current;
          const active = stepNum === current;
          return (
            <React.Fragment key={key}>
              {i > 0 && <View style={[styles.stepLine, (done || active) && styles.stepLineDone]} />}
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, done && styles.stepCircleDone, active && styles.stepCircleActive]}>
                  {done ? <CheckCircle size={13} color="#FFF" /> : (
                    <Text style={[styles.stepNum, active && { color: '#FFF' }]}>{stepNum}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, active && styles.stepLabelActive]} numberOfLines={1}>{t(locale, key)}</Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  const renderStatusBadge = (status: string) => {
    const { label, color } = getStatusLabel(locale, status);
    return (
      <View style={[styles.statusPill, { backgroundColor: color + '15' }]}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.statusText, { color }]}>{label}</Text>
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
    const actionColor = getPrimaryActionColor(order.status);

    return (
      <View key={order.id} style={[styles.card, isFocus && { borderLeftWidth: 4, borderLeftColor: '#1A73E8' }]}>
        <TouchableOpacity style={styles.cardInner} onPress={() => openOrder(order)} activeOpacity={0.6}>
          <View style={styles.cardRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Text style={styles.cardTime}>{inCalendar ? scheduledFull : timeOnly}</Text>
                {renderStatusBadge(order.status)}
              </View>
              <Text style={styles.cardAddress} numberOfLines={2}>{formatAddressDisplay(order.address, locale)}</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.cardClient}>{order.clientName}</Text>
                <View style={styles.cardPricePill}>
                  <PaymentTypeIcon type={order.paymentType} size={11} color="#1A73E8" />
                  <Text style={styles.cardPriceText}>{(order.paymentAmount || 0).toLocaleString()} ₽</Text>
                </View>
              </View>
            </View>
            <ChevronRight size={18} color="#C4C4C4" />
          </View>
        </TouchableOpacity>

        {order.status === 'container_placed' && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
            <ContainerTimer updatedAt={order.updatedAt} />
          </View>
        )}

        {showAction && order.status !== 'completed' && (
          <View style={styles.cardActions}>
            {isPayment && mode === 'locked' ? (
              <View style={styles.btnLocked}><Text style={styles.btnLockedText}>{t(locale, 'finishCurrentFirst')}</Text></View>
            ) : isPayment ? (
              <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#00897B' }]} onPress={() => openOrder(order)} activeOpacity={0.8}>
                <CreditCard size={16} color="#FFF" />
                <Text style={styles.btnPrimaryText}>{t(locale, 'stepPayment')}</Text>
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
    const btnStyle = large ? styles.btnLarge : styles.btnPrimary;
    const txtStyle = large ? styles.btnLargeText : styles.btnPrimaryText;
    const mode = queueActionMode(order, focusOrder);

    if (order.status === 'picked_up') {
      if (mode === 'locked') return <View style={large ? { marginTop: 8 } : { paddingTop: 4 }}><Text style={styles.payLockText}>{t(locale, 'finishCurrentFirst')}</Text></View>;
      const hasPaid = order.paymentStatus === 'received' || order.paymentStatus === 'entered';
      if (hasPaid) {
        return (
          <View style={large ? { marginTop: 8 } : { paddingTop: 4 }}>
            <View style={styles.paidBanner}><CheckCircle size={14} color="#FFF" /><Text style={styles.paidBannerText}>Оплата получена</Text></View>
            <TouchableOpacity style={[btnStyle, { backgroundColor: '#00897B' }, isUpdating && { opacity: 0.5 }]} disabled={isUpdating} onPress={() => handleFinalizeCashOrder(order)} activeOpacity={0.8}>
              {isUpdating ? <ActivityIndicator color="#FFF" /> : <Text style={txtStyle}>{t(locale, 'btnComplete')}</Text>}
            </TouchableOpacity>
          </View>
        );
      }
      return (
        <View style={large ? { marginTop: 8 } : { paddingTop: 4 }}>
          <Text style={styles.payWaitText}>Ожидание оплаты</Text>
          <TouchableOpacity style={[btnStyle, { backgroundColor: '#EF6C00', flexDirection: 'row', gap: 8, justifyContent: 'center' }, isUpdating && { opacity: 0.5 }]} disabled={isUpdating} onPress={() => handleReceivedCash(order)} activeOpacity={0.8}>
            <Banknote size={16} color="#FFF" /><Text style={txtStyle}>Получил наличные</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (mode === 'locked' || (mode === 'accept_only' && order.status !== 'new')) {
      return <View style={[btnStyle, styles.btnLocked]}><Text style={styles.btnLockedText}>{t(locale, 'lockedAction')}</Text></View>;
    }
    if (!btnKey) return null;

    return (
      <TouchableOpacity style={[btnStyle, { backgroundColor: getPrimaryActionColor(order.status) }, isUpdating && { opacity: 0.5 }]} disabled={isUpdating} onPress={() => runPrimaryAction(order)} activeOpacity={0.8}>
        {isUpdating ? <ActivityIndicator color="#FFF" /> : <Text style={txtStyle}>{t(locale, btnKey)}</Text>}
      </TouchableOpacity>
    );
  };

  // ══════════════════════ AUTH ══════════════════════
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6FA' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 }}>
            <TouchableOpacity style={{ padding: 10, backgroundColor: '#FFF', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setShowSettings(!showSettings); }}>
              <Settings color="#9E9E9E" size={18} />
            </TouchableOpacity>
          </View>
          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#1A73E8', alignItems: 'center', justifyContent: 'center', shadowColor: '#1A73E8', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}>
              <Warehouse color="#FFF" size={34} />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginTop: 16 }}>{t(locale, 'appTitle')}</Text>
            <Text style={{ fontSize: 14, color: '#9E9E9E', marginTop: 4 }}>{t(locale, 'appSub')}</Text>
          </View>
          {showSettings ? (
            <View style={styles.authCard}>
              <Text style={styles.authCardTitle}>{t(locale, 'settings')}</Text>
              <Text style={styles.authLabel}>{t(locale, 'serverIp')}</Text>
              <TextInput style={styles.authInput} value={serverIp} onChangeText={setServerIp} placeholder="crm-aziz.vercel.app" placeholderTextColor="#BDBDBD" autoCapitalize="none" autoCorrect={false} />
              <Text style={styles.authLabel}>{t(locale, 'port')}</Text>
              <TextInput style={styles.authInput} value={port} onChangeText={setPort} placeholder={t(locale, 'portPlaceholder')} placeholderTextColor="#BDBDBD" keyboardType="numeric" />
              <TouchableOpacity style={styles.authBtn} onPress={async () => { try { await AsyncStorage.setItem('@server_ip', serverIp); await AsyncStorage.setItem('@server_port', port); LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setShowSettings(false); } catch { showAlert(t(locale, 'loginError'), t(locale, 'saveSettingsError')); } }} activeOpacity={0.8}>
                <Text style={styles.authBtnText}>{t(locale, 'save')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.authCard}>
              <Text style={styles.authCardTitle}>{t(locale, 'signIn')}</Text>
              <View style={styles.authInputRow}><User color="#BDBDBD" size={18} /><TextInput style={styles.authInputInline} value={username} onChangeText={setUsername} placeholder={t(locale, 'login')} placeholderTextColor="#BDBDBD" autoCapitalize="none" /></View>
              <View style={styles.authInputRow}><Lock color="#BDBDBD" size={18} /><TextInput style={styles.authInputInline} value={password} onChangeText={setPassword} placeholder={t(locale, 'password')} placeholderTextColor="#BDBDBD" secureTextEntry autoCapitalize="none" /></View>
              <TouchableOpacity style={styles.authBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.authBtnText}>{t(locale, 'signIn')}</Text>}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        <AlertModal visible={customAlert.visible} title={customAlert.title} message={customAlert.message} onClose={() => setCustomAlert(c => ({ ...c, visible: false }))} locale={locale} onOpenSettings={customAlert.openSettings ? () => Linking.openSettings() : undefined} />
      </SafeAreaView>
    );
  }

  // ══════════════════════ MAIN ══════════════════════
  const todayActiveCount = activeOrders.filter(o => isSameDay(new Date(o.scheduledAt), new Date())).length;
  const futureActiveCount = activeOrders.filter(o => !isSameDay(new Date(o.scheduledAt), new Date())).length;
  const bottomTabs = [
    { id: 'home' as const, label: t(locale, 'tabToday'), Icon: Home, count: todayActiveCount },
    { id: 'calendar' as const, label: t(locale, 'calendar'), Icon: Calendar, count: futureActiveCount },
    { id: 'history' as const, label: t(locale, 'history'), Icon: TrendingUp, count: 0 },
    { id: 'profile' as const, label: 'Профиль', Icon: UserCircle, count: 0 },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {activeTab !== 'profile' && (
        <View style={styles.header}>
          <View style={styles.headerAvatar}><Text style={styles.headerAvatarText}>{driver!.name.charAt(0)}</Text></View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerName}>{driver!.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Car size={12} color="#1A73E8" />
              <Text style={styles.headerPlate}>{driver!.vehiclePlate}</Text>
              <View style={[styles.gpsIndicator, { backgroundColor: isTrackingGps ? '#E8F5E9' : '#F5F5F5' }]}>
                <Animated.View style={[styles.gpsDotAnim, { opacity: isTrackingGps ? pulseAnim : 0.4, backgroundColor: isTrackingGps ? '#43A047' : '#BDBDBD' }]} />
                <Text style={{ fontSize: 9, fontWeight: '700', color: isTrackingGps ? '#2E7D32' : '#9E9E9E' }}>GPS</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.headerBtn} onPress={() => fetchOrders(true)} activeOpacity={0.6}>
            <RefreshCw size={18} color="#616161" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }} refreshControl={activeTab !== 'profile' ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A73E8" /> : undefined}>
        {loading && activeTab !== 'profile' ? (
          <ActivityIndicator size="large" color="#1A73E8" style={{ marginTop: 60 }} />

        ) : activeTab === 'home' ? (
          <View>
            {/* EARNINGS BANNER */}
            <View style={styles.earningsBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.earningsIcon}><TrendingUp size={20} color="#FFF" /></View>
                <View><Text style={styles.earningsLabel}>Сегодня</Text><Text style={styles.earningsVal}>{todayEarned.toLocaleString()} ₽</Text></View>
              </View>
              <Text style={styles.earningsCount}>{activeOrders.filter(o => isSameDay(new Date(o.scheduledAt), new Date())).length} заказов</Text>
            </View>

            <View style={{ paddingHorizontal: 16 }}>
              {(() => {
                const homeOrders = activeOrders;
                const overdueContainers = homeOrders.filter(o => { if (o.status !== 'container_placed') return false; const start = new Date(o.updatedAt).getTime(); if (isNaN(start)) return false; return (Date.now() - start) >= 2 * 60 * 60 * 1000; });
                const activeContainers = homeOrders.filter(o => { if (o.status !== 'container_placed') return false; const start = new Date(o.updatedAt).getTime(); if (isNaN(start)) return false; return (Date.now() - start) < 2 * 60 * 60 * 1000; });
                const newOrders = homeOrders.filter(o => o.status === 'new');
                const assignedOrders = homeOrders.filter(o => o.status === 'assigned');
                const activeTripOrder = homeOrders.find(o => o.status === 'in_progress' || o.status === 'picked_up') || (assignedOrders.length > 0 ? assignedOrders.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0] : null);
                const nextOrders = assignedOrders.filter(o => o.id !== activeTripOrder?.id);
                const hasAnyOrders = overdueContainers.length > 0 || activeTripOrder != null || activeContainers.length > 0 || newOrders.length > 0;

                if (!hasAnyOrders) return (
                  <View style={styles.emptyState}><CheckCircle size={48} color="#43A047" /><Text style={styles.emptyTitle}>{t(locale, 'allDone')}</Text><Text style={styles.emptySub}>{t(locale, 'allDoneSub')}</Text></View>
                );

                return (
                  <View style={{ gap: 8 }}>
                    {overdueContainers.length > 0 && (
                      <View style={styles.overdueWrap}>
                        <TouchableOpacity style={styles.overdueHead} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setIsOverdueExpanded(!isOverdueExpanded); }} activeOpacity={0.8}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><AlertCircle size={16} color="#D32F2F" /><Text style={styles.overdueTitle}>Просроченные ({overdueContainers.length})</Text></View>
                          <ChevronDown size={16} color="#D32F2F" style={{ transform: [{ rotate: isOverdueExpanded ? '180deg' : '0deg' }] }} />
                        </TouchableOpacity>
                        {isOverdueExpanded && <View style={{ padding: 12, gap: 8 }}>{overdueContainers.map(o => renderCompactCard(o))}</View>}
                      </View>
                    )}

                    {activeTripOrder && (
                      <View style={{ marginTop: 4 }}>
                        <Text style={styles.secTitle}>Текущий заказ</Text>
                        <View style={styles.heroCard}>
                          <View style={styles.heroTop}>
                            <View style={styles.heroLabelPill}><Text style={styles.heroLabelText}>{activeTripOrder.status === 'in_progress' ? 'В пути' : 'Назначен'}</Text></View>
                            {renderStatusBadge(activeTripOrder.status)}
                          </View>
                          {renderStepProgress(activeTripOrder.status)}
                          <View style={styles.heroTimeBlock}>
                            <Clock size={14} color="#1A73E8" />
                            <Text style={styles.heroTimeText}>{formatDate(activeTripOrder.scheduledAt)}</Text>
                          </View>
                          <Text style={styles.heroAddr}>{formatAddressDisplay(activeTripOrder.address, locale)}</Text>
                          <View style={styles.heroActionsRow}>
                            <TouchableOpacity style={styles.heroNavBtn} onPress={() => openNavigation(activeTripOrder)} activeOpacity={0.8}>
                              <Navigation size={16} color="#FFF" /><Text style={styles.heroNavText}>Навигация</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.heroCallBtn} onPress={() => callClient(activeTripOrder.clientPhone)} activeOpacity={0.8}>
                              <Phone size={16} color="#FFF" />
                            </TouchableOpacity>
                          </View>
                          <View style={styles.heroInfoGrid}>
                            <View style={styles.heroInfoItem}><Text style={styles.heroInfoLabel}>Клиент</Text><Text style={styles.heroInfoVal}>{activeTripOrder.clientName}</Text></View>
                            <View style={styles.heroInfoItem}><Text style={styles.heroInfoLabel}>Оплата</Text><Text style={styles.heroInfoVal}>{activeTripOrder.paymentAmount.toLocaleString()} ₽</Text></View>
                            <View style={styles.heroInfoItem}><Text style={styles.heroInfoLabel}>Контейнер</Text><Text style={styles.heroInfoVal}>{activeTripOrder.containerSizeM3} m³</Text></View>
                          </View>
                          {activeTripOrder.status === 'assigned' && <Text style={styles.heroHint}>{t(locale, 'earlyTripHint')}</Text>}
                          {renderPrimaryButton(activeTripOrder, true)}
                          <TouchableOpacity style={{ marginTop: 8, alignItems: 'center', padding: 6 }} onPress={() => openOrder(activeTripOrder)} activeOpacity={0.6}>
                            <Text style={{ fontSize: 13, color: '#1A73E8', fontWeight: '600' }}>{t(locale, 'openOrder')}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {activeContainers.length > 0 && <View><Text style={[styles.secTitle, { color: '#EF6C00' }]}>Контейнеры</Text>{activeContainers.map(o => renderCompactCard(o))}</View>}
                    {newOrders.length > 0 && <View><Text style={[styles.secTitle, { color: '#1A73E8' }]}>Новые</Text>{newOrders.map(o => renderCompactCard(o))}</View>}
                    {nextOrders.length > 0 && <View><Text style={styles.secTitle}>Следующие</Text>{nextOrders.map((o, idx) => renderCompactCard(o, idx + 2))}</View>}
                  </View>
                );
              })()}
            </View>
          </View>

        ) : activeTab === 'calendar' ? (
          <View>
            {/* Calendar Header */}
            <View style={styles.calTopBar}>
              <TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.calNavBtn}><ChevronLeft size={20} color="#1A1A1A" /></TouchableOpacity>
              <Text style={styles.calMonthText}>{formatMonthYear(locale, displayedMonth)}</Text>
              <TouchableOpacity onPress={() => shiftMonth(1)} style={styles.calNavBtn}><ChevronRight size={20} color="#1A1A1A" /></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.calTodayPill} onPress={handleGoToCalendarToday}><Text style={styles.calTodayPillText}>{t(locale, 'goToToday')}</Text></TouchableOpacity>

            {/* Calendar Grid */}
            <View style={styles.calGridWrap}>
              <View style={styles.calWeekHeader}>
                {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(wd => <Text key={wd} style={styles.calWeekLabel}>{wd}</Text>)}
              </View>
              {Array.from({ length: Math.ceil(calendarGridDays.length / 7) }, (_, rowIdx) => (
                <View key={rowIdx} style={styles.calRow}>
                  {calendarGridDays.slice(rowIdx * 7, rowIdx * 7 + 7).map(({ date, isCurrentMonth, key }) => {
                    const selected = isSameDay(date, selectedCalendarDate);
                    const isToday = isSameDay(date, new Date());
                    const dayOrders = orders.filter(o => isSameDay(new Date(o.scheduledAt), date));
                    const hasOrders = dayOrders.length > 0;
                    return (
                      <TouchableOpacity key={key} style={styles.calDayCell} onPress={() => handleSelectCalendarDate(date)} activeOpacity={0.6}>
                        <View style={[styles.calDayCircle, !isCurrentMonth && { opacity: 0.25 }, isToday && !selected && styles.calDayToday, selected && styles.calDaySel]}>
                          <Text style={[styles.calDayNum, selected && { color: '#FFF' }]}>{date.getDate()}</Text>
                        </View>
                        {hasOrders && isCurrentMonth ? <View style={[styles.calOrderDot, selected && { backgroundColor: '#FFF' }]} /> : <View style={{ height: 6 }} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Day Orders */}
            <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
              {ordersForCalendarDay.length > 0 && (
                <View style={styles.calDayStats}>
                  <View style={styles.calDayStat}><Text style={styles.calDayStatNum}>{calendarDayStats.total}</Text><Text style={styles.calDayStatLabel}>Всего</Text></View>
                  <View style={styles.calDayStat}><Text style={[styles.calDayStatNum, { color: '#1A73E8' }]}>{calendarDayStats.active}</Text><Text style={styles.calDayStatLabel}>В работе</Text></View>
                  <View style={styles.calDayStat}><Text style={[styles.calDayStatNum, { color: '#43A047' }]}>{calendarDayStats.done}</Text><Text style={styles.calDayStatLabel}>Готово</Text></View>
                </View>
              )}
              <Text style={styles.secTitle}>{formatCalendarDayTitle(locale, selectedCalendarDate)}</Text>
              {ordersForCalendarDay.length === 0 ? (
                <View style={styles.emptyState}><Clock size={32} color="#BDBDBD" /><Text style={styles.emptyTitle}>{t(locale, 'noOrdersOnDate')}</Text></View>
              ) : (
                <View style={{ gap: 8 }}>{ordersForCalendarDay.map(o => renderCompactCard(o, undefined, true))}</View>
              )}
            </View>
          </View>

        ) : activeTab === 'history' ? (
          <View style={{ flex: 1 }}>
            <View style={styles.histHeader}><TrendingUp size={20} color="#1A73E8" /><Text style={styles.histTitle}>Финансы</Text></View>
            {(() => {
              const todayOrders = historyOrders.filter(o => isSameDay(new Date(o.scheduledAt), new Date()));
              const todayCash = todayOrders.filter(o => o.paymentType === 'cash').reduce((s, o) => s + (o.paymentAmount || 0), 0);
              const todayBeznal = todayOrders.filter(o => o.paymentType === 'card' || o.paymentType === 'online').reduce((s, o) => s + (o.paymentAmount || 0), 0);
              return (
                <View style={styles.histSummary}>
                  <Text style={styles.histSummaryLabel}>Сегодня</Text>
                  <Text style={styles.histSummaryTotal}>{(todayCash + todayBeznal).toLocaleString()} ₽</Text>
                  <View style={styles.histSummaryRow}>
                    <View style={styles.histSummaryChip}><Text style={styles.histSummaryChipLabel}>Наличные</Text><Text style={styles.histSummaryChipVal}>{todayCash.toLocaleString()} ₽</Text></View>
                    <View style={styles.histSummaryChip}><Text style={styles.histSummaryChipLabel}>Безнал</Text><Text style={[styles.histSummaryChipVal, { color: '#1A73E8' }]}>{todayBeznal.toLocaleString()} ₽</Text></View>
                  </View>
                </View>
              );
            })()}
            <View style={styles.filterBar}>
              {(['day', 'week', 'month'] as const).map(f => (
                <TouchableOpacity key={f} style={[styles.filterBtn, historyFilter === f && styles.filterBtnActive]} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setHistoryFilter(f); }} activeOpacity={0.8}>
                  <Text style={[styles.filterBtnText, historyFilter === f && styles.filterBtnTextActive]}>{f === 'day' ? 'День' : f === 'week' ? 'Неделя' : 'Месяц'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.chartWrap}>
              <TouchableOpacity style={styles.chartArrow} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setHistoryOffset(o => o + 1); }}><ChevronLeft size={16} color="#616161" /></TouchableOpacity>
              <View style={styles.chartCols}>
                {historyChartData.map((data, index) => {
                  const sel = selectedHistoryIndex === index;
                  const maxAmt = Math.max(...historyChartData.map(d => d.totalAmount), 1);
                  const barH = Math.max((data.totalAmount / maxAmt) * 100, 4);
                  return (
                    <TouchableOpacity key={index} style={styles.chartCol} onPress={() => setSelectedHistoryIndex(index)} activeOpacity={0.8}>
                      <Text style={[styles.chartVal, sel && { color: '#1A73E8', fontWeight: '700' }]}>{data.totalAmount > 0 ? `${(data.totalAmount / 1000).toFixed(0)}k` : ''}</Text>
                      <View style={[styles.chartBar, { height: barH }, sel && { backgroundColor: '#1A73E8' }]} />
                      <Text style={[styles.chartLabel, sel && { color: '#1A1A1A', fontWeight: '700' }]}>{data.label.replace('\n', ' ')}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity disabled={historyOffset === 0} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setHistoryOffset(o => Math.max(0, o - 1)); }} style={[styles.chartArrow, historyOffset === 0 && { opacity: 0.3 }]}><ChevronRight size={16} color="#616161" /></TouchableOpacity>
            </View>
            {selectedHistoryIndex !== null && historyChartData[selectedHistoryIndex] && (() => {
              const p = historyChartData[selectedHistoryIndex];
              const po = historyOrders.filter(o => { const tt = new Date(o.scheduledAt).getTime(); return tt >= p.dateStart.getTime() && tt < p.dateEnd.getTime(); });
              const pCash = po.filter(o => o.paymentType === 'cash').reduce((s, o) => s + (o.paymentAmount || 0), 0);
              const pBez = po.filter(o => o.paymentType === 'card' || o.paymentType === 'online').reduce((s, o) => s + (o.paymentAmount || 0), 0);
              return (
                <View style={styles.histPeriod}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View><Text style={styles.histPeriodTitle}>{p.fullLabel}</Text><Text style={{ fontSize: 12, color: '#9E9E9E', marginTop: 2 }}>Заказов: {p.orderCount}</Text></View>
                    <Text style={styles.histPeriodAmt}>{p.totalAmount.toLocaleString()} ₽</Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, color: '#757575' }}>Нал: {pCash.toLocaleString()} ₽</Text>
                    <Text style={{ fontSize: 12, color: '#757575' }}>Безнал: {pBez.toLocaleString()} ₽</Text>
                  </View>
                </View>
              );
            })()}
            <View style={{ paddingHorizontal: 16, paddingBottom: 32, marginTop: 16 }}>
              <Text style={styles.secTitle}>Завершённые</Text>
              {historyOrders.filter(o => { if (selectedHistoryIndex === null || !historyChartData[selectedHistoryIndex]) return false; const tt = new Date(o.scheduledAt).getTime(); return tt >= historyChartData[selectedHistoryIndex].dateStart.getTime() && tt < historyChartData[selectedHistoryIndex].dateEnd.getTime(); }).map(o => renderCompactCard(o, undefined, true))}
            </View>
          </View>

        ) : activeTab === 'profile' ? (
          <View>
            <View style={styles.profHeader}>
              <View style={styles.profAvatarLarge}><Text style={styles.profAvatarLetter}>{driver!.name.charAt(0)}</Text></View>
              <Text style={styles.profName}>{driver!.name}</Text>
              <View style={styles.profPlateChip}><Car size={13} color="#1A73E8" /><Text style={styles.profPlateText}>{driver!.vehiclePlate}</Text></View>
              <Text style={{ fontSize: 12, color: isTrackingGps ? '#43A047' : '#9E9E9E', marginTop: 8 }}>{isTrackingGps ? 'GPS активна' : 'GPS выкл.'}</Text>
            </View>
            <View style={styles.profStats}>
              <View style={styles.profStatItem}><Text style={styles.profStatVal}>{historyOrders.length}</Text><Text style={styles.profStatLabel}>Выполнено</Text></View>
              <View style={[styles.profStatItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F0F0F0' }]}><Text style={[styles.profStatVal, { color: '#43A047' }]}>{historyOrders.reduce((s, o) => s + (Number(o.driverFee) || 0), 0).toLocaleString()}</Text><Text style={styles.profStatLabel}>Заработано ₽</Text></View>
              <View style={styles.profStatItem}><Text style={[styles.profStatVal, { color: '#EF6C00' }]}>{activeOrders.length}</Text><Text style={styles.profStatLabel}>Активных</Text></View>
            </View>
            <View style={styles.profTodayBanner}><View style={{ flex: 1 }}><Text style={styles.profTodayLabel}>Заработано сегодня</Text><Text style={styles.profTodayVal}>{todayEarned.toLocaleString()} ₽</Text></View><TrendingUp size={28} color="#43A047" /></View>
            <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 8 }}>
              <TouchableOpacity style={styles.profAction} onPress={() => fetchOrders(true)} activeOpacity={0.7}>
                <View style={[styles.profActionDot, { backgroundColor: '#E8EAF6' }]}><RefreshCw size={16} color="#1A73E8" /></View>
                <Text style={styles.profActionLabel}>Обновить заказы</Text><ChevronRight size={16} color="#BDBDBD" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.profAction} onPress={async () => { await clearSession(); }} activeOpacity={0.7}>
                <View style={[styles.profActionDot, { backgroundColor: '#FFEBEE' }]}><LogOut size={16} color="#D32F2F" /></View>
                <Text style={[styles.profActionLabel, { color: '#D32F2F' }]}>Выйти</Text><ChevronRight size={16} color="#BDBDBD" />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* TAB BAR */}
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
        {bottomTabs.map(({ id, label, Icon, count }) => {
          const act = activeTab === id;
          return (
            <TouchableOpacity key={id} style={styles.tabItem} onPress={() => { if (id === 'calendar') handleGoToCalendarToday(); LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiveTab(id); }} activeOpacity={0.6}>
              <View style={[styles.tabDot, act && styles.tabDotActive]}><Icon size={22} color={act ? '#1A73E8' : '#BDBDBD'} /></View>
              <Text style={[styles.tabText, act && styles.tabTextActive]}>{label}</Text>
              {count > 0 && <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{count > 9 ? '9+' : count}</Text></View>}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* BOTTOM SHEET */}
      {selectedOrder && (() => {
        const order = selectedOrder;
        const isUpdating = updatingOrderId === order.id;
        return (
          <Modal animationType="slide" transparent visible onRequestClose={() => setSelectedOrder(null)}>
            <View style={styles.sheetOverlay}>
              <Pressable style={{ flex: 1 }} onPress={() => setSelectedOrder(null)} />
              <View style={styles.sheetContainer}>
                <View style={styles.sheetHandle} />
                <View style={styles.sheetHead}><TouchableOpacity onPress={() => setSelectedOrder(null)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}><X size={22} color="#1A1A1A" /></TouchableOpacity><Text style={styles.sheetHeadTitle}>Заказ #{order.id}</Text><View style={{ width: 22 }} /></View>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 32 }} bounces={true} showsVerticalScrollIndicator={true}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>{renderStatusBadge(order.status)}<Text style={{ fontSize: 14, fontWeight: '600', color: '#BDBDBD' }}>#{order.id}</Text></View>
                  {renderStepProgress(order.status)}
                  <View style={styles.sheetInfoCard}>
                    <View style={styles.sheetInfoRow}><Clock size={14} color="#1A73E8" /><View><Text style={styles.sheetInfoLabel}>{t(locale, 'scheduledAt')}</Text><Text style={styles.sheetInfoVal}>{formatDate(order.scheduledAt)}</Text></View></View>
                    <View style={styles.sheetDivider} />
                    <View style={styles.sheetInfoRow}><MapPin size={14} color="#EF6C00" /><View style={{ flex: 1 }}><Text style={styles.sheetInfoLabel}>Адрес</Text><Text style={styles.sheetInfoVal}>{formatAddressDisplay(order.address, locale)}</Text></View></View>
                    {order.containerNumber && <><View style={styles.sheetDivider} /><View style={styles.sheetInfoRow}><Warehouse size={14} color="#757575" /><View><Text style={styles.sheetInfoLabel}>Контейнер</Text><Text style={styles.sheetInfoVal}>#{order.containerNumber}</Text></View></View></>}
                  </View>
                  {order.status === 'assigned' && <Text style={styles.sheetHint}>{t(locale, 'earlyTripHint')}</Text>}
                  {queueActionMode(order, focusOrder) === 'locked' && <Text style={[styles.sheetHint, { backgroundColor: '#FFF3E0', color: '#E65100' }]}>{t(locale, 'finishCurrentFirst')}</Text>}
                  <TouchableOpacity style={styles.sheetNavBtn} onPress={() => openNavigation(order)} activeOpacity={0.8}><Navigation size={16} color="#FFF" /><Text style={styles.sheetNavText}>Открыть навигатор</Text></TouchableOpacity>
                  <View style={styles.sheetClientRow}>
                    <View style={{ flex: 1 }}><Text style={styles.sheetClientLabel}>Клиент</Text><Text style={styles.sheetClientName}>{order.clientName}</Text></View>
                    <TouchableOpacity style={styles.sheetCallCircle} onPress={() => callClient(order.clientPhone)} activeOpacity={0.8}><Phone size={18} color="#FFF" /></TouchableOpacity>
                  </View>
                  {order.operatorNote ? <View style={styles.sheetNote}><Text style={styles.sheetNoteText}>{order.operatorNote}</Text></View> : null}
                  <TouchableOpacity style={styles.sheetToggle} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setShowOrderDetails(v => !v); }} activeOpacity={0.7}>
                    <Text style={styles.sheetToggleText}>{showOrderDetails ? t(locale, 'hideDetails') : t(locale, 'showDetails')}</Text><ChevronDown size={14} color="#9E9E9E" style={{ transform: [{ rotate: showOrderDetails ? '180deg' : '0deg' }] }} />
                  </TouchableOpacity>
                  {showOrderDetails && (
                    <View style={styles.sheetDetailsGrid}>
                      <View style={styles.sheetDetailItem}><Text style={styles.sheetDetailLabel}>{t(locale, 'container')}</Text><Text style={styles.sheetDetailVal}>{order.containerSizeM3} m³</Text></View>
                      <View style={styles.sheetDetailItem}><Text style={styles.sheetDetailLabel}>{t(locale, 'duration')}</Text><Text style={styles.sheetDetailVal}>{getRentalLabel(locale, order.rentalDuration)}</Text></View>
                      <View style={styles.sheetDetailItem}><Text style={styles.sheetDetailLabel}>Оплата</Text><Text style={styles.sheetDetailVal}>{order.paymentAmount.toLocaleString()} ₽</Text></View>
                      <View style={styles.sheetDetailItem}><Text style={styles.sheetDetailLabel}>Тип</Text><Text style={styles.sheetDetailVal}>{getPaymentLabel(locale, order.paymentType)}</Text></View>
                    </View>
                  )}
                  {order.status === 'in_progress' && canRunWorkflowOnOrder(order, focusOrder) && (
                    <TouchableOpacity style={{ marginTop: 12, padding: 8, alignItems: 'center' }} disabled={isUpdating} onPress={() => handlePickupContainer(order)}><Text style={{ color: '#00897B', fontWeight: '600', fontSize: 13 }}>{t(locale, 'pickUpNow')}</Text></TouchableOpacity>
                  )}
                </ScrollView>
                {order.status !== 'completed' && <View style={styles.sheetFooter}>{renderPrimaryButton(order, true)}</View>}
              </View>
            </View>
          </Modal>
        );
      })()}

      <AlertModal visible={customAlert.visible} title={customAlert.title} message={customAlert.message} onClose={() => setCustomAlert(c => ({ ...c, visible: false }))} locale={locale} onOpenSettings={customAlert.openSettings ? () => Linking.openSettings() : undefined} />

      <Modal animationType="fade" transparent visible={!!navModalOrder} onRequestClose={() => setNavModalOrder(null)}>
        <Pressable style={styles.alertOverlay} onPress={() => setNavModalOrder(null)}>
          <View style={styles.alertBox} onStartShouldSetResponder={() => true}>
            <Navigation size={28} color="#1A73E8" style={{ marginBottom: 12 }} />
            <Text style={styles.alertTitle}>Выберите карту</Text>
            <View style={{ width: '100%', gap: 10, marginTop: 16 }}>
              <TouchableOpacity style={[styles.alertBtnPrimary, { backgroundColor: '#FFB300' }]} onPress={() => navModalOrder && openMapApp('yandex', navModalOrder)}><Text style={{ color: '#000', fontSize: 15, fontWeight: '600' }}>Yandex Maps</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.alertBtnPrimary, { backgroundColor: '#1A73E8' }]} onPress={() => navModalOrder && openMapApp('google', navModalOrder)}><Text style={{ color: '#FFF', fontSize: 15, fontWeight: '600' }}>Google Maps</Text></TouchableOpacity>
              <TouchableOpacity style={{ paddingVertical: 12, alignItems: 'center' }} onPress={() => setNavModalOrder(null)}><Text style={{ color: '#9E9E9E', fontSize: 15, fontWeight: '600' }}>Отмена</Text></TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() { return <SafeAreaProvider><AppInner /></SafeAreaProvider>; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F6FA' },

  // AUTH
  authCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  authCardTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 24, textAlign: 'center' },
  authLabel: { color: '#9E9E9E', fontSize: 11, marginBottom: 6, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  authInput: { backgroundColor: '#F5F6FA', borderRadius: 12, padding: 14, color: '#1A1A1A', marginBottom: 14, fontSize: 15 },
  authInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F6FA', borderRadius: 12, paddingHorizontal: 14, marginBottom: 14, height: 52, gap: 12 },
  authInputInline: { flex: 1, color: '#1A1A1A', fontSize: 15, height: '100%' },
  authBtn: { backgroundColor: '#1A73E8', height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  authBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  // HEADER
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A73E8', alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  headerName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  headerPlate: { fontSize: 11, color: '#9E9E9E', fontWeight: '600' },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F6FA', alignItems: 'center', justifyContent: 'center' },
  gpsIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  gpsDotAnim: { width: 6, height: 6, borderRadius: 3 },

  // EARNINGS
  earningsBanner: { marginHorizontal: 16, marginTop: 12, marginBottom: 8, backgroundColor: '#1A73E8', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  earningsIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  earningsLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  earningsVal: { fontSize: 22, fontWeight: '700', color: '#FFF', marginTop: 2 },
  earningsCount: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  // SECTION
  secTitle: { fontSize: 13, fontWeight: '700', color: '#9E9E9E', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },

  // CARD
  card: { backgroundColor: '#FFF', borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  cardInner: { padding: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardTime: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  cardAddress: { fontSize: 13, color: '#616161', lineHeight: 18, marginTop: 2 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  cardClient: { fontSize: 13, color: '#9E9E9E', fontWeight: '500' },
  cardPricePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F0FE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  cardPriceText: { fontSize: 12, color: '#1A73E8', fontWeight: '700' },
  cardActions: { paddingHorizontal: 14, paddingBottom: 12 },
  cardOrderNum: { fontSize: 12, fontWeight: '600', color: '#BDBDBD' },

  // BUTTONS
  btnPrimary: { height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  btnPrimaryText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  btnLarge: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  btnLargeText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  btnLocked: { backgroundColor: '#F5F6FA' },
  btnLockedText: { color: '#BDBDBD', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  paidBanner: { backgroundColor: '#43A047', padding: 10, borderRadius: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  paidBannerText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  payWaitText: { fontSize: 13, color: '#9E9E9E', fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  payLockText: { fontSize: 12, color: '#BDBDBD', textAlign: 'center' },

  // STATUS
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },

  // STEP
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginVertical: 12, paddingHorizontal: 4 },
  stepItem: { alignItems: 'center', width: 58 },
  stepLine: { height: 2, flex: 1, backgroundColor: '#E0E0E0', marginTop: 12, marginHorizontal: -2 },
  stepLineDone: { backgroundColor: '#1A73E8' },
  stepCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F5F6FA', borderWidth: 2, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepCircleDone: { backgroundColor: '#43A047', borderColor: '#43A047' },
  stepCircleActive: { backgroundColor: '#1A73E8', borderColor: '#1A73E8' },
  stepNum: { fontSize: 10, fontWeight: '700', color: '#BDBDBD' },
  stepLabel: { fontSize: 9, color: '#BDBDBD', fontWeight: '500', textAlign: 'center' },
  stepLabelActive: { color: '#1A73E8', fontWeight: '700' },

  // TIMER
  timerContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
  timerText: { fontSize: 13, fontWeight: '600' },

  // EMPTY
  emptyState: { backgroundColor: '#FFF', borderRadius: 16, padding: 40, alignItems: 'center', marginTop: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#616161', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#BDBDBD', marginTop: 4 },

  // OVERDUE
  overdueWrap: { backgroundColor: '#FFEBEE', borderRadius: 12, overflow: 'hidden' },
  overdueHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  overdueTitle: { fontSize: 13, fontWeight: '700', color: '#C62828' },

  // HERO CARD
  heroCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, shadowColor: '#1A73E8', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 3, borderLeftWidth: 4, borderLeftColor: '#1A73E8' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  heroLabelPill: { backgroundColor: '#E8F0FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  heroLabelText: { fontSize: 11, fontWeight: '700', color: '#1A73E8', textTransform: 'uppercase' },
  heroTimeBlock: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F5F6FA', borderRadius: 10, padding: 10, marginTop: 8 },
  heroTimeText: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  heroAddr: { fontSize: 15, color: '#1A1A1A', marginTop: 10, lineHeight: 21, fontWeight: '600' },
  heroActionsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  heroNavBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1A73E8', borderRadius: 12, paddingVertical: 11 },
  heroNavText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  heroCallBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#43A047', alignItems: 'center', justifyContent: 'center' },
  heroInfoGrid: { flexDirection: 'row', marginTop: 12, backgroundColor: '#F5F6FA', borderRadius: 12, overflow: 'hidden' },
  heroInfoItem: { flex: 1, padding: 10, alignItems: 'center' },
  heroInfoLabel: { fontSize: 10, color: '#9E9E9E', fontWeight: '600', textTransform: 'uppercase' },
  heroInfoVal: { fontSize: 13, color: '#1A1A1A', fontWeight: '700', marginTop: 2 },
  heroHint: { fontSize: 12, color: '#1565C0', backgroundColor: '#E3F2FD', padding: 10, borderRadius: 10, marginTop: 10, lineHeight: 17 },

  // CALENDAR
  calTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  calNavBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  calMonthText: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', textTransform: 'capitalize' },
  calTodayPill: { alignSelf: 'center', marginTop: 6, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12, backgroundColor: '#E8F0FE' },
  calTodayPillText: { fontSize: 12, fontWeight: '600', color: '#1A73E8' },
  calGridWrap: { marginHorizontal: 12, backgroundColor: '#FFF', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  calWeekHeader: { flexDirection: 'row', marginBottom: 4, paddingHorizontal: 2 },
  calWeekLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#BDBDBD', paddingVertical: 4 },
  calRow: { flexDirection: 'row', paddingHorizontal: 2 },
  calDayCell: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  calDayCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  calDayToday: { borderWidth: 2, borderColor: '#1A73E8' },
  calDaySel: { backgroundColor: '#1A73E8' },
  calDayNum: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  calOrderDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#1A73E8', marginTop: 2 },
  calDayStats: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  calDayStat: { flex: 1, backgroundColor: '#FFF', borderRadius: 10, paddingVertical: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  calDayStatNum: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  calDayStatLabel: { fontSize: 10, color: '#9E9E9E', fontWeight: '600', marginTop: 2 },

  // HISTORY
  histHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginTop: 16 },
  histTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  histSummary: { marginHorizontal: 16, marginTop: 12, backgroundColor: '#FFF', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  histSummaryLabel: { fontSize: 12, color: '#9E9E9E' },
  histSummaryTotal: { fontSize: 24, fontWeight: '700', color: '#43A047', marginTop: 4 },
  histSummaryRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  histSummaryChip: { flex: 1, backgroundColor: '#F5F6FA', padding: 10, borderRadius: 10 },
  histSummaryChipLabel: { fontSize: 11, color: '#9E9E9E' },
  histSummaryChipVal: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginTop: 2 },
  filterBar: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, marginHorizontal: 16, marginTop: 12, padding: 3, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#1A73E8' },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: '#9E9E9E' },
  filterBtnTextActive: { color: '#FFF', fontWeight: '700' },
  chartWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: '#FFF', marginHorizontal: 16, borderRadius: 14, padding: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  chartArrow: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F5F6FA', alignItems: 'center', justifyContent: 'center' },
  chartCols: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110, flex: 1, paddingHorizontal: 4 },
  chartCol: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  chartVal: { fontSize: 8, color: '#BDBDBD', marginBottom: 3, fontWeight: '600' },
  chartBar: { width: '55%', backgroundColor: '#E0E0E0', borderRadius: 4 },
  chartLabel: { fontSize: 9, color: '#BDBDBD', marginTop: 4, fontWeight: '500', textAlign: 'center' },
  histPeriod: { backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 10, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  histPeriodTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  histPeriodAmt: { fontSize: 18, fontWeight: '700', color: '#43A047' },

  // PROFILE
  profHeader: { marginHorizontal: 16, marginTop: 20, backgroundColor: '#FFF', borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  profAvatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1A73E8', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  profAvatarLetter: { color: '#FFF', fontSize: 32, fontWeight: '700' },
  profName: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  profPlateChip: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: '#E8F0FE', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  profPlateText: { fontSize: 13, fontWeight: '600', color: '#1A73E8' },
  profStats: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, backgroundColor: '#FFF', borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  profStatItem: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  profStatVal: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  profStatLabel: { fontSize: 10, color: '#9E9E9E', fontWeight: '600', marginTop: 2 },
  profTodayBanner: { marginHorizontal: 16, marginTop: 12, backgroundColor: '#E8F5E9', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center' },
  profTodayLabel: { fontSize: 11, color: '#2E7D32', fontWeight: '600', textTransform: 'uppercase' },
  profTodayVal: { fontSize: 24, fontWeight: '700', color: '#43A047', marginTop: 2 },
  profAction: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, padding: 14, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  profActionDot: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  profActionLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1A1A1A' },

  // TAB BAR
  tabBar: { flexDirection: 'row', backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 4 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 2, position: 'relative' },
  tabDot: { width: 44, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  tabDotActive: { backgroundColor: '#E8F0FE' },
  tabText: { fontSize: 10, color: '#BDBDBD', marginTop: 2, fontWeight: '600' },
  tabTextActive: { color: '#1A73E8' },
  tabBadge: { position: 'absolute', top: -2, right: '18%', backgroundColor: '#D32F2F', borderRadius: 7, minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  tabBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '700' },

  // SHEET
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheetContainer: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', minHeight: '50%', position: 'absolute', bottom: 0, left: 0, right: 0, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -4 }, elevation: 10 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginTop: 10 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  sheetHeadTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', flex: 1, textAlign: 'center' },
  sheetInfoCard: { backgroundColor: '#F5F6FA', borderRadius: 14, padding: 14, marginTop: 8 },
  sheetInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  sheetInfoLabel: { fontSize: 10, color: '#9E9E9E', fontWeight: '600', textTransform: 'uppercase' },
  sheetInfoVal: { fontSize: 14, color: '#1A1A1A', fontWeight: '600', marginTop: 1 },
  sheetDivider: { height: 1, backgroundColor: '#E8E8E8', marginVertical: 10 },
  sheetHint: { fontSize: 12, color: '#1565C0', backgroundColor: '#E3F2FD', padding: 10, borderRadius: 10, marginTop: 10, lineHeight: 17 },
  sheetNavBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, backgroundColor: '#1A73E8', borderRadius: 12, paddingVertical: 12 },
  sheetNavText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  sheetClientRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, backgroundColor: '#F5F6FA', borderRadius: 14, padding: 12 },
  sheetClientLabel: { fontSize: 10, color: '#9E9E9E', fontWeight: '600', textTransform: 'uppercase' },
  sheetClientName: { fontSize: 15, color: '#1A1A1A', fontWeight: '600', marginTop: 2 },
  sheetCallCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#43A047', alignItems: 'center', justifyContent: 'center' },
  sheetNote: { backgroundColor: '#FFF3E0', borderRadius: 10, padding: 12, marginTop: 12 },
  sheetNoteText: { fontSize: 13, color: '#E65100', lineHeight: 18 },
  sheetToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, paddingVertical: 10, backgroundColor: '#F5F6FA', borderRadius: 10 },
  sheetToggleText: { fontSize: 13, color: '#9E9E9E', fontWeight: '600' },
  sheetDetailsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, backgroundColor: '#F5F6FA', borderRadius: 12, overflow: 'hidden' },
  sheetDetailItem: { width: '50%', padding: 12 },
  sheetDetailLabel: { fontSize: 10, color: '#9E9E9E', fontWeight: '600', textTransform: 'uppercase' },
  sheetDetailVal: { fontSize: 14, color: '#1A1A1A', fontWeight: '600', marginTop: 2 },
  sheetFooter: { paddingHorizontal: 20, paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },

  // ALERT
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  alertBox: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  alertTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 4 },
  alertMessage: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  alertBtn: { backgroundColor: '#1A73E8', borderRadius: 12, paddingVertical: 13, width: '100%', alignItems: 'center' },
  alertBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  alertBtnPrimary: { borderRadius: 12, paddingVertical: 13, width: '100%', alignItems: 'center' },
  alertBtnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E0E0E0' },
  alertBtnTextSecondary: { color: '#616161' },
});
