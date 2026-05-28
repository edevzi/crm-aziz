import { pgTable, serial, text, timestamp, integer, boolean, pgEnum, decimal } from "drizzle-orm/pg-core";

export const rentalDurationEnum = pgEnum('rental_duration', ['1_day', '1_week', '1_month']);
export const orderStatusEnum = pgEnum('status', ['new', 'assigned', 'in_progress', 'container_placed', 'picked_up', 'completed']);
export const paymentTypeEnum = pgEnum('payment_type', ['cash', 'card', 'online']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'received', 'entered']);
export const expenseCategoryEnum = pgEnum('expense_category', ['fuel', 'diesel', 'spare_parts', 'repair', 'utilization', 'base_rent', 'gai', 'driver_salary', 'worker_salary', 'dispatcher_salary', 'referral_fee', 'other', 'master_fee', 'tractor']);
export const usersRoleEnum = pgEnum('user_role', ['admin', 'operator']);
export const safeTransactionTypeEnum = pgEnum('safe_transaction_type', ['income', 'expense']);
export const warehouseTransactionTypeEnum = pgEnum('warehouse_transaction_type', ['inbound', 'outbound']);

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  mapUrl: text('map_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const dispatchers = pgTable('dispatchers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  role: usersRoleEnum('role').default('operator').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

export const drivers = pgTable('drivers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  vehiclePlate: text('vehicle_plate').notNull(),
  username: text('username'),
  password: text('password'),
  latitude: text('latitude'),
  longitude: text('longitude'),
  locationUpdatedAt: timestamp('location_updated_at'),
  expoPushToken: text('expo_push_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id),
  driverId: integer('driver_id').references(() => drivers.id),
  operatorNote: text('operator_note'),
  address: text('address').notNull(),
  mapUrl: text('map_url'),
  scheduledAt: timestamp('scheduled_at').notNull(),
  containerSizeM3: integer('container_size_m3').notNull(),
  containerNumber: text('container_number'),
  rentalDuration: text('rental_duration').notNull(),
  status: orderStatusEnum('status').default('new').notNull(),
  paymentAmount: integer('payment_amount').notNull(),
  paymentType: paymentTypeEnum('payment_type').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('pending').notNull(),
  clientCategory: text('client_category').default('direct').notNull(),
  dispatcherId: integer('dispatcher_id').references(() => dispatchers.id),
  dispatcherFee: integer('dispatcher_fee'),
  referralName: text('referral_name'),
  referralPercent: integer('referral_percent'),
  isClosed: boolean('is_closed').default(false).notNull(),
  operatorId: integer('operator_id').references(() => users.id),
  isExternalVehicle: boolean('is_external_vehicle').default(false).notNull(),
  externalDriverName: text('external_driver_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastNotifiedAt: timestamp('last_notified_at'),
});

export const fuelLogs = pgTable('fuel_logs', {
  id: serial('id').primaryKey(),
  driverId: integer('driver_id').references(() => drivers.id).notNull(),
  stationName: text('station_name').notNull(),
  liters: integer('liters').notNull(),
  priceRub: integer('price_rub').notNull(),
  vehicle: text('vehicle').notNull(),
  operatorId: integer('operator_id').references(() => users.id),
  loggedAt: timestamp('logged_at').defaultNow().notNull(),
});

export const utilizationLogs = pgTable('utilization_logs', {
  id: serial('id').primaryKey(),
  driverId: integer('driver_id').references(() => drivers.id).notNull(),
  vehiclePlate: text('vehicle_plate').notNull(),
  m3: integer('m3').notNull(),
  amountRub: integer('amount_rub').notNull(),
  note: text('note'),
  operatorId: integer('operator_id').references(() => users.id),
  loggedAt: timestamp('logged_at').defaultNow().notNull(),
});

export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  category: expenseCategoryEnum('category').notNull(),
  amountRub: integer('amount_rub').notNull(),
  note: text('note'),
  orderId: integer('order_id').references(() => orders.id),
  driverId: integer('driver_id').references(() => drivers.id),
  dispatcherId: integer('dispatcher_id').references(() => dispatchers.id),
  liters: integer('liters'),
  operatorId: integer('operator_id').references(() => users.id),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

export const warehouseTransactions = pgTable('warehouse_transactions', {
  id: serial('id').primaryKey(),
  type: warehouseTransactionTypeEnum('type').notNull(),
  volumeM3: integer('volume_m3').notNull(),
  containerSizeM3: integer('container_size_m3'),
  containerCount: integer('container_count'),
  note: text('note'),
  orderId: integer('order_id').references(() => orders.id),
  driverId: integer('driver_id').references(() => drivers.id),
  driverAmount: integer('driver_amount'),
  svalkaAmount: integer('svalka_amount'),
  operatorId: integer('operator_id').references(() => users.id),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

export const safeTransactions = pgTable('safe_transactions', {
  id: serial('id').primaryKey(),
  type: safeTransactionTypeEnum('type').notNull(),
  amountRub: integer('amount_rub').notNull(),
  note: text('note'),
  operatorId: integer('operator_id').references(() => users.id),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

export const gasStationInbounds = pgTable('gas_station_inbounds', {
  id: serial('id').primaryKey(),
  liters: integer('liters').notNull(),
  note: text('note'),
  operatorId: integer('operator_id').references(() => users.id),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});
