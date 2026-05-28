export type Locale = 'ru';

const translations = {
  ru: {
    appTitle: 'Водитель',
    appSub: 'Управление заказами',
    login: 'Логин',
    password: 'Пароль',
    signIn: 'Войти',
    settings: 'Настройки',
    serverIp: 'Адрес сервера',
    port: 'Порт',
    portPlaceholder: 'Пусто или 3000',
    save: 'Сохранить',
    language: 'Язык',
    enterCredentials: 'Введите логин и пароль',
    loginError: 'Ошибка входа',
    connectionError: 'Не удалось подключиться к серверу',
    saveSettingsError: 'Ошибка сохранения настроек',
    understood: 'Понятно',
    hello: 'Здравствуйте',
    active: 'Активные',
    tabToday: 'Сегодня',
    history: 'История',
    calendar: 'Календарь',
    nextTask: 'Сейчас сделать',
    doNow: 'Начать',
    openOrder: 'Подробнее',
    otherOrders: 'Следующие заказы',
    stepOf: 'Шаг',
    stepAccept: 'Принять',
    stepOnWay: 'В пути',
    stepContainer: 'Контейнер',
    stepPayment: 'Оплата',
    whatToDo: 'Что сделать:',
    waitingPayment: 'Примите оплату от клиента',
    queueNext: 'Следующий',
    tapCardHint: 'Нажмите для подробностей',
    btnAccept: 'ПРИНЯЛ ЗАКАЗ',
    btnStart: 'ВЫЕХАЛ В ПУТЬ',
    btnDrop: 'КОНТЕЙНЕР УСТАНОВЛЕН',
    btnPickup: 'ЗАБРАЛ КОНТЕЙНЕР',
    btnPayCash: 'НАЛИЧНЫЕ',
    btnPayCard: 'КАРТА',
    btnPayOnline: 'ОНЛАЙН',
    btnComplete: 'ЗАВЕРШИТЬ',
    paidBeznal: 'Оплачено (Безнал)',
    updating: 'Сохранение...',
    sessionExpired: 'Сессия истекла',
    sessionExpiredMessage: 'Данные обновлены. Войдите снова (логин: driver, пароль: driver123).',
    loadErrorRetry: 'Не удалось загрузить заказы. Проверьте интернет или войдите снова.',
    allDone: 'Всё готово!',
    allDoneSub: 'Новые заказы появятся здесь',
    showDetails: 'Подробнее',
    hideDetails: 'Скрыть',
    callClient: 'Позвонить клиенту',
    all: 'Все',
    noOrders: 'Заказов нет',
    noOrdersSub: 'Заказы не найдены',
    noOrdersOnDate: 'На этот день заказов нет',
    today: 'Сегодня',
    tomorrow: 'Завтра',
    order: 'Заказ',
    status: 'Статус',
    client: 'Клиент',
    address: 'Адрес',
    details: 'Детали',
    container: 'Контейнер',
    duration: 'Срок',
    operatorNote: 'Заметка оператора',
    actions: 'Действия',
    steps: 'Этапы заказа',
    acceptOrder: 'Принял заказ',
    startTrip: 'Выехал в путь',
    dropContainer: 'Контейнер установлен',
    pickUpNow: 'Забрал контейнер сразу',
    pickUp: 'Забрал контейнер',
    completeWithPayment: 'Принять оплату и завершить',
    cashReceived: 'Наличные получены',
    cardReceived: 'Оплата картой',
    onlineReceived: 'Онлайн перевод',
    currency: 'руб.',
    call: 'Позвонить',
    newOrderTitle: 'Новый заказ!',
    newOrderMessage: 'Вам назначен новый заказ',
    orderCompletedTitle: 'Готово!',
    orderCompletedMessage: 'Заказ закрыт, оплата получена',
    statusUpdateError: 'Не удалось обновить статус',
    completeError: 'Не удалось завершить заказ',
    loadError: 'Ошибка загрузки данных',
    gpsPermissionTitle: 'Доступ к геолокации',
    gpsPermissionMessage: 'В пути ваше местоположение отправляется оператору. Включите GPS в настройках.',
    gpsAlwaysTitle: 'Нужен доступ «Всегда»',
    gpsAlwaysMessage: 'Для карты: Настройки → Driver CRM → Геолокация → «Всегда» / «Разрешить всё время».',
    openSettings: 'Открыть настройки',
    gpsLoginHint: 'В следующих окнах выберите «При использовании», затем «Всегда».',
    gpsTracking: 'Геолокация отправляется (в пути)',
    gpsIdle: 'Геолокация выкл. — включится при выезде',
    gpsWhy: 'GPS работает только в статусе «В пути». После завершения заказа отключается.',
    status_new: 'Новый',
    status_assigned: 'Назначен',
    status_in_progress: 'В пути',
    status_container_placed: 'Контейнер установлен',
    status_picked_up: 'Забран',
    status_completed: 'Завершен',
    rental_1_day: '1 день',
    rental_1_week: '1 неделя',
    rental_1_month: '1 месяц',
    payment_cash: 'Наличные',
    payment_card: 'Карта',
    payment_online: 'Онлайн',
    currentOrder: 'Сейчас в работе',
    scheduledAt: 'Запланировано',
    acceptAnytimeHint: 'Принять заказ — в любое время',
    earlyTripHint: 'Выезд — можно раньше запланированного (расчёт маршрута)',
    finishCurrentFirst: 'Сначала завершите текущий заказ. В следующем доступно только «Принял заказ».',
    lockedAction: 'Заказ в очереди',
    calendarDayOrders: 'Заказы на день',
    calendarSchedule: 'Расписание дня',
    calendarActiveCount: 'Активные',
    calendarDoneCount: 'Завершены',
    goToToday: 'Сегодня',
    statusBadge: 'Статус',
  },
} as const;

const MONTHS: Record<Locale, string[]> = {
  ru: [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ],
};

const WEEKDAYS: Record<Locale, string[]> = {
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
};

const WEEKDAYS_SHORT: Record<Locale, string[]> = {
  ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
};

export function getWeekdayShort(locale: Locale, date: Date): string {
  return WEEKDAYS_SHORT[locale][date.getDay()] ?? '';
}

export function getWeekdayLong(locale: Locale, date: Date): string {
  return WEEKDAYS[locale][date.getDay()] ?? '';
}

export function formatMonthYear(locale: Locale, date: Date): string {
  const month = MONTHS[locale][date.getMonth()] ?? '';
  return `${month.charAt(0).toUpperCase() + month.slice(1)} ${date.getFullYear()}`;
}

export function formatCalendarDayTitle(locale: Locale, date: Date): string {
  const day = date.getDate();
  const month = MONTHS[locale][date.getMonth()] ?? '';
  const year = date.getFullYear();
  const weekday = getWeekdayLong(locale, date);
  return `${weekday}, ${day} ${month} ${year}`;
}

export function formatTimeOnly(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export type TranslationKey = keyof typeof translations.ru;

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale][key] ?? translations.ru[key] ?? key;
}

export function getStatusLabel(locale: Locale, status: string): { label: string; color: string; bg: string } {
  const key = `status_${status}` as TranslationKey;
  const label = translations[locale][key as keyof typeof translations.ru]
    ? t(locale, key)
    : status;
  const colors: Record<string, { color: string; bg: string }> = {
    new: { color: '#3b82f6', bg: '#eff6ff' },
    assigned: { color: '#6366f1', bg: '#e0e7ff' },
    in_progress: { color: '#f59e0b', bg: '#fef3c7' },
    container_placed: { color: '#f97316', bg: '#ffedd5' },
    picked_up: { color: '#14b8a6', bg: '#f0fdfa' },
    completed: { color: '#10b981', bg: '#ecfdf5' },
  };
  const c = colors[status] ?? { color: '#64748b', bg: '#f8fafc' };
  return { label, ...c };
}

export function getRentalLabel(locale: Locale, duration: string): string {
  const key = `rental_${duration}` as TranslationKey;
  return translations[locale][key as keyof typeof translations.ru]
    ? t(locale, key)
    : duration.replace('_', ' ');
}

export function getPaymentLabel(locale: Locale, type: string): string {
  const key = `payment_${type}` as TranslationKey;
  return translations[locale][key as keyof typeof translations.ru]
    ? t(locale, key)
    : type;
}

export const STATUS_FILTERS = ['all', 'new', 'assigned', 'in_progress', 'container_placed', 'picked_up'] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export function getFilterLabel(locale: Locale, filter: StatusFilter): string {
  if (filter === 'all') return t(locale, 'all');
  return getStatusLabel(locale, filter).label;
}
