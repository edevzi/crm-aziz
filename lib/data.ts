import { db } from './db';
import { orders, clients, drivers, fuelLogs, expenses, warehouseTransactions, dispatchers, users, safeTransactions, gasStationInbounds } from './schema';
import { unstable_cache } from 'next/cache';
import { desc, eq, and, or, ilike, ne, asc, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export const getOperators = unstable_cache(
  async () => {
    return await db.select().from(users).where(eq(users.role, 'operator')).orderBy(desc(users.createdAt));
  },
  ['operators-list'],
  { revalidate: 30, tags: ['users'] }
);

export const getDashboardData = unstable_cache(
  async () => {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  },
  ['dashboard-orders'],
  { revalidate: 30, tags: ['orders'] }
);

export const getOrders = async (status?: string, q?: string, from?: string, to?: string) => {
    const user = await getCurrentUser();
    let conditions = [];
    
    if (user?.role === 'operator') {
      conditions.push(eq(orders.operatorId, user.id));
    }

    if (status === 'active') {
      conditions.push(eq(orders.isClosed, false));
      conditions.push(ne(orders.status, 'completed'));
    } else if (status === 'pending_confirmation') {
      conditions.push(eq(orders.isClosed, false));
      conditions.push(or(eq(orders.status, 'completed'), eq(orders.paymentStatus, 'received')));
    } else if (status === 'closed') {
      conditions.push(eq(orders.isClosed, true));
    } else if (status && status !== 'all') {
      conditions.push(eq(orders.status, status as any));
    }
    
    if (q) {
      const num = parseInt(q);
      if (!isNaN(num)) {
        conditions.push(or(
          ilike(clients.name, `%${q}%`),
          ilike(orders.address, `%${q}%`),
          ilike(drivers.name, `%${q}%`),
          eq(orders.id, num),
          eq(orders.paymentAmount, num)
        ));
      } else {
        conditions.push(or(
          ilike(clients.name, `%${q}%`),
          ilike(orders.address, `%${q}%`),
          ilike(drivers.name, `%${q}%`)
        ));
      }
    }

    if (from) {
      conditions.push(sql`${orders.scheduledAt} >= ${new Date(from).toISOString()}`);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(sql`${orders.scheduledAt} <= ${toDate.toISOString()}`);
    }

    const query = db.select({
      order: orders,
      client: clients,
      driver: drivers,
      dispatcher: dispatchers,
      operator: users,
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .leftJoin(drivers, eq(orders.driverId, drivers.id))
    .leftJoin(dispatchers, eq(orders.dispatcherId, dispatchers.id))
    .leftJoin(users, eq(orders.operatorId, users.id));

    const orderByClause = status === 'active'
      ? [sql`CASE WHEN ${orders.status} = 'in_progress' THEN 1 ELSE 2 END`, asc(orders.createdAt)]
      : [desc(orders.createdAt)];

    return await (conditions.length > 0 
      ? query.where(and(...conditions)).orderBy(...orderByClause)
      : query.orderBy(...orderByClause));
  };

export const getClients = unstable_cache(
  async () => {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  },
  ['clients-list'],
  { revalidate: 30, tags: ['clients'] }
);

export const getDispatchers = unstable_cache(
  async () => {
    return await db.select().from(dispatchers).orderBy(desc(dispatchers.createdAt));
  },
  ['dispatchers-list'],
  { revalidate: 30, tags: ['dispatchers'] }
);

export const getDrivers = unstable_cache(
  async () => {
    return await db.select().from(drivers).orderBy(desc(drivers.createdAt));
  },
  ['drivers-list'],
  { revalidate: 30, tags: ['drivers'] }
);

export const getFinanceData = unstable_cache(
  async () => {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    const allExpenses = await db.select().from(expenses).orderBy(desc(expenses.recordedAt));
    const allGasStationInbounds = await db.select().from(gasStationInbounds).orderBy(desc(gasStationInbounds.recordedAt));
    return { allOrders, allExpenses, allGasStationInbounds };
  },
  ['finance-data'],
  { revalidate: 30, tags: ['orders', 'expenses', 'warehouse', 'gasStation'] }
);

export const getFuelLogs = unstable_cache(
  async () => {
    return await db.select({
      log: fuelLogs,
      driver: drivers,
    })
    .from(fuelLogs)
    .leftJoin(drivers, eq(fuelLogs.driverId, drivers.id))
    .orderBy(desc(fuelLogs.loggedAt));
  },
  ['fuel-logs'],
  { revalidate: 30, tags: ['fuelLogs'] }
);

export const getWarehouseData = unstable_cache(
  async () => {
    const allTransactions = await db.select().from(warehouseTransactions).orderBy(desc(warehouseTransactions.recordedAt));
    return { allTransactions };
  },
  ['warehouse-data'],
  { revalidate: 30, tags: ['warehouse'] }
);

export const getSafeData = unstable_cache(
  async () => {
    return await db.select({
      transaction: safeTransactions,
      operator: users,
    })
    .from(safeTransactions)
    .leftJoin(users, eq(safeTransactions.operatorId, users.id))
    .orderBy(desc(safeTransactions.recordedAt));
  },
  ['safe-data'],
  { revalidate: 30, tags: ['safe'] }
);

