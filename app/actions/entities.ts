'use server';

import { db } from '@/lib/db';
import { 
  clients, 
  drivers, 
  orders, 
  fuelLogs, 
  expenses, 
  warehouseTransactions,
  dispatchers,
  safeTransactions,
  utilizationLogs,
  gasStationInbounds
} from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { sendPushNotification } from '@/lib/push-notifications';

// Gas Station Inbounds
export async function addGasStationInbound(data: { liters: number; note?: string; recordedAt?: Date }) {
  const user = await getCurrentUser();
  await db.insert(gasStationInbounds).values({
    liters: data.liters,
    note: data.note || null,
    operatorId: user ? user.id : null,
    recordedAt: data.recordedAt || new Date(),
  });
  revalidateTag('gasStation');
  revalidateTag('expenses');
  revalidatePath('/fuel');
}


// Clients
export async function createClient(data: any) {
  await db.insert(clients).values({
    name: data.name,
    phone: data.phone,
    address: data.address,
    mapUrl: data.mapUrl || null,
  });
  revalidateTag('clients');
  revalidatePath('/clients');
}

export async function updateClient(id: number, data: any) {
  await db.update(clients).set({
    name: data.name,
    phone: data.phone,
    address: data.address,
    mapUrl: data.mapUrl || null,
  }).where(eq(clients.id, id));
  revalidateTag('clients');
  revalidatePath('/clients');
}

// Dispatchers
export async function createDispatcher(data: any) {
  const [row] = await db.insert(dispatchers).values({
    name: data.name,
    phone: data.phone,
  }).returning();
  revalidateTag('dispatchers');
  return row;
}

export async function updateDispatcher(id: number, data: any) {
  await db.update(dispatchers).set({
    name: data.name,
    phone: data.phone,
  }).where(eq(dispatchers.id, id));
  revalidateTag('dispatchers');
}

// Drivers
export async function createDriver(data: any) {
  await db.insert(drivers).values({
    name: data.name,
    phone: data.phone,
    vehiclePlate: data.vehiclePlate,
    username: data.username || null,
    password: data.password || null,
  });
  revalidateTag('drivers');
  revalidatePath('/drivers');
}

export async function updateDriver(id: number, data: any) {
  await db.update(drivers).set({
    name: data.name,
    phone: data.phone,
    vehiclePlate: data.vehiclePlate,
    username: data.username || null,
    password: data.password || null,
  }).where(eq(drivers.id, id));
  revalidateTag('drivers');
  revalidatePath('/drivers');
}

// Fuel
export async function createFuelLog(data: any) {
  const user = await getCurrentUser();
  await db.transaction(async (tx) => {
    const cleanPrice = parseInt(String(data.priceRub).replace(/\D/g, '')) || 0;
    await tx.insert(fuelLogs).values({
      driverId: parseInt(data.driverId),
      stationName: data.stationName,
      liters: parseInt(data.liters),
      priceRub: cleanPrice,
      vehicle: data.vehicle,
      operatorId: user ? user.id : null,
    });

    await tx.insert(expenses).values({
      category: 'fuel',
      amountRub: cleanPrice,
      note: `Автоматически добавлено из заправки: ${data.vehicle} (${data.liters}L) - ${data.stationName}`,
      driverId: parseInt(data.driverId),
      liters: parseInt(data.liters),
      operatorId: user ? user.id : null,
    });
  });

  revalidateTag('fuelLogs');
  revalidateTag('expenses');
  revalidatePath('/fuel');
  revalidatePath('/finance');
}

export async function updateFuelLog(id: number, data: any) {
  await db.update(fuelLogs).set({
    driverId: parseInt(data.driverId),
    stationName: data.stationName,
    liters: parseInt(data.liters),
    priceRub: parseInt(String(data.priceRub).replace(/\D/g, '')) || 0,
    vehicle: data.vehicle,
  }).where(eq(fuelLogs.id, id));
  revalidateTag('fuelLogs');
  revalidatePath('/fuel');
}

// Utilization
export async function createUtilizationLog(data: any) {
  const user = await getCurrentUser();
  await db.transaction(async (tx) => {
    const cleanPrice = parseInt(String(data.amountRub).replace(/\D/g, '')) || 0;
    const m3Val = parseInt(data.m3) || 0;
    await tx.insert(utilizationLogs).values({
      driverId: parseInt(data.driverId),
      vehiclePlate: data.vehiclePlate,
      m3: m3Val,
      amountRub: cleanPrice,
      note: data.note,
      operatorId: user ? user.id : null,
    });

    await tx.insert(expenses).values({
      category: 'utilization',
      amountRub: cleanPrice,
      note: `Автоматически добавлено из свалки: ${data.vehiclePlate} (${m3Val} м³) - ${data.note || ''}`,
      driverId: parseInt(data.driverId),
      liters: m3Val, // Store m3 in liters column for unified expense tracking
      operatorId: user ? user.id : null,
    });
  });

  revalidateTag('utilizationLogs');
  revalidateTag('expenses');
  revalidatePath('/utilization');
  revalidatePath('/finance');
}

export async function updateUtilizationLog(id: number, data: any) {
  await db.update(utilizationLogs).set({
    driverId: parseInt(data.driverId),
    vehiclePlate: data.vehiclePlate,
    m3: parseInt(data.m3) || 0,
    amountRub: parseInt(String(data.amountRub).replace(/\D/g, '')) || 0,
    note: data.note,
  }).where(eq(utilizationLogs.id, id));
  revalidateTag('utilizationLogs');
  revalidatePath('/utilization');
}

// Expenses
export async function createExpense(data: any) {
  const user = await getCurrentUser();
  await db.insert(expenses).values({
    category: data.category,
    amountRub: parseInt(String(data.amountRub).replace(/\D/g, '')) || 0,
    note: data.note,
    orderId: data.orderId || null,
    driverId: data.driverId ? parseInt(data.driverId) : null,
    dispatcherId: data.dispatcherId ? parseInt(data.dispatcherId) : null,
    liters: data.liters ? parseInt(data.liters) : null,
    operatorId: user ? user.id : null,
  });
  revalidateTag('expenses');
  revalidatePath('/finance');
  revalidatePath('/warehouse');
}

export async function updateExpense(id: number, data: any) {
  await db.update(expenses).set({
    category: data.category,
    amountRub: parseInt(String(data.amountRub).replace(/\D/g, '')) || 0,
    note: data.note,
    orderId: data.orderId || null,
    driverId: data.driverId ? parseInt(data.driverId) : null,
    dispatcherId: data.dispatcherId ? parseInt(data.dispatcherId) : null,
    liters: data.liters ? parseInt(data.liters) : null,
  }).where(eq(expenses.id, id));
  revalidateTag('expenses');
  revalidatePath('/finance');
  revalidatePath('/warehouse');
}

// Warehouse Transactions
export async function addWarehouseTransaction(data: { 
  type: 'inbound' | 'outbound', 
  volumeM3: number, 
  containerSizeM3?: number,
  containerCount?: number,
  note?: string,
  driverId?: number,
  driverAmount?: number,
  svalkaAmount?: number
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await db.transaction(async (tx) => {
    // 1. Log Warehouse Transaction
    await tx.insert(warehouseTransactions).values({
      type: data.type,
      volumeM3: data.volumeM3,
      containerSizeM3: data.containerSizeM3,
      containerCount: data.containerCount,
      note: data.note,
      driverId: data.driverId,
      driverAmount: data.driverAmount,
      svalkaAmount: data.svalkaAmount,
      operatorId: user.id
    });

    // 2. Log expenses if it's outbound and has amounts
    if (data.type === 'outbound') {
      if (data.driverAmount && data.driverAmount > 0 && data.driverId) {
        await tx.insert(expenses).values({
          category: 'driver_salary',
          amountRub: data.driverAmount,
          driverId: data.driverId,
          note: `Оплата водителю за вывоз мусора (Склад)`,
          operatorId: user.id
        });
      }
      
      if (data.svalkaAmount && data.svalkaAmount > 0) {
        await tx.insert(expenses).values({
          category: 'utilization',
          amountRub: data.svalkaAmount,
          driverId: data.driverId, // Link to driver if available
          note: `Оплата свалке за вывоз мусора (Склад)`,
          operatorId: user.id
        });
      }
    }
  });

  revalidateTag('warehouseTransactions');
  revalidateTag('expenses');
  revalidatePath('/warehouse');
  revalidatePath('/finance');
}

// Safe Transactions
export async function createSafeTransaction(data: { type: 'income' | 'expense'; amountRub: number; note?: string }) {
  const user = await getCurrentUser();
  await db.insert(safeTransactions).values({
    type: data.type,
    amountRub: parseInt(String(data.amountRub).replace(/\D/g, '')) || 0,
    note: data.note || null,
    operatorId: user ? user.id : null,
  });
  revalidateTag('safe');
  revalidatePath('/safe');
}


function parseDate(dateStr: any): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  
  const str = String(dateStr).trim();
  
  // Try dd.mm.yyyy hh:mm or dd.mm.yyyy or dd/mm/yyyy
  const match = str.match(/^(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?$/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    const hour = match[4] ? parseInt(match[4], 10) : 0;
    const minute = match[5] ? parseInt(match[5], 10) : 0;
    return new Date(year, month, day, hour, minute);
  }

  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Orders
export async function createOrder(data: any) {
  try {
    const isExternalVehicle = !!data.isExternalVehicle;
    const containerSizeM3 = isExternalVehicle ? 8 : parseInt(data.containerSizeM3);
    const paymentAmount = parseInt(String(data.paymentAmount).replace(/\D/g, '')) || 0;
    const clientCategory = isExternalVehicle ? 'direct' : (data.clientCategory || 'direct');

    // --- Resolve clientId (upsert inline if needed) ---
    let clientId: number | null = null;
    if (!isExternalVehicle) {
      if (data.clientId === 'new' || !data.clientId) {
        if (!data.clientName || !data.clientPhone) {
          return { success: false, error: "Пожалуйста, укажите имя и телефон клиента" };
        }
        const [newClient] = await db.insert(clients).values({
          name: data.clientName,
          phone: data.clientPhone,
          address: data.clientAddress || data.address,
          mapUrl: data.clientMapUrl || null,
        }).returning();
        clientId = newClient.id;
        revalidateTag('clients');
      } else {
        clientId = parseInt(data.clientId);
        // Update client if inline fields changed
        if (data.clientName || data.clientPhone) {
          await db.update(clients).set({
            name: data.clientName,
            phone: data.clientPhone,
            address: data.clientAddress || data.address,
            mapUrl: data.clientMapUrl || null,
          }).where(eq(clients.id, clientId));
          revalidateTag('clients');
        }
      }
      if (isNaN(clientId)) {
        return { success: false, error: "Пожалуйста, выберите клиента" };
      }
    }

    // --- Resolve dispatcherId (upsert inline if needed) ---
    let dispatcherId: number | null = null;
    if (!isExternalVehicle && clientCategory === 'dispatcher') {
      if (data.dispatcherId === 'new' || !data.dispatcherId) {
        if (!data.dispatcherName || !data.dispatcherPhone) {
          return { success: false, error: "Пожалуйста, укажите имя и телефон диспетчера" };
        }
        const [newDisp] = await db.insert(dispatchers).values({
          name: data.dispatcherName,
          phone: data.dispatcherPhone,
        }).returning();
        dispatcherId = newDisp.id;
        revalidateTag('dispatchers');
      } else {
        dispatcherId = parseInt(data.dispatcherId);
        // Update dispatcher if inline fields changed
        if (data.dispatcherName || data.dispatcherPhone) {
          await db.update(dispatchers).set({
            name: data.dispatcherName,
            phone: data.dispatcherPhone,
          }).where(eq(dispatchers.id, dispatcherId));
          revalidateTag('dispatchers');
        }
      }
    }

    if (!isExternalVehicle) {
      if (!data.address || data.address.trim() === '') {
        return { success: false, error: "Пожалуйста, укажите адрес" };
      }
      if (isNaN(containerSizeM3)) {
        return { success: false, error: "Пожалуйста, укажите корректный размер контейнера" };
      }
    }
    if (isNaN(paymentAmount)) {
      return { success: false, error: "Пожалуйста, укажите корректную сумму оплаты" };
    }

    const newPaymentStatus = isExternalVehicle ? 'entered' : (data.paymentStatus || 'pending');
    const dispatcherFee = isExternalVehicle ? null : (data.dispatcherFee ? parseInt(String(data.dispatcherFee).replace(/\D/g, '')) : null);
    
    // --- Driver Availability Check ---
    const parsedScheduledAt = parseDate(data.scheduledAt);
    if (!isExternalVehicle && data.driverId) {
      const driverIdInt = parseInt(data.driverId);
      const scheduledTime = parsedScheduledAt.getTime();
      const BUFFER = 3 * 60 * 60 * 1000;
      
      const driverActiveOrders = await db.select().from(orders).where(eq(orders.driverId, driverIdInt));
      for (const ao of driverActiveOrders) {
        if (ao.status === 'completed') continue;
        const aoTime = new Date(ao.scheduledAt).getTime();
        if (Math.abs(aoTime - scheduledTime) <= BUFFER) {
          return { success: false, error: "Ошибка: Водитель занят в это время (±3 часа)! Пожалуйста, выберите другое время или водителя." };
        }
      }
    }

    const user = await getCurrentUser();
    const status = isExternalVehicle ? 'completed' : (data.status || 'new');
    const address = isExternalVehicle ? (data.address || 'База') : data.address;
    const isClosed = isExternalVehicle ? true : false;

    const [newOrder] = await db.insert(orders).values({
      clientId,
      driverId: (!isExternalVehicle && data.driverId) ? parseInt(data.driverId) : null,
      operatorNote: data.operatorNote,
      address,
      mapUrl: isExternalVehicle ? null : (data.mapUrl || null),
      scheduledAt: parseDate(data.scheduledAt),
      containerSizeM3,
      containerNumber: isExternalVehicle ? null : (data.containerNumber || null),
      rentalDuration: isExternalVehicle ? '1 день' : data.rentalDuration,
      status,
      paymentAmount,
      paymentType: data.paymentType,
      paymentStatus: newPaymentStatus,
      clientCategory,
      dispatcherId,
      dispatcherFee,
      referralName: isExternalVehicle ? null : data.referralName,
      referralPercent: isExternalVehicle ? null : (data.referralPercent ? parseInt(data.referralPercent) : null),
      operatorId: user ? user.id : null,
      isExternalVehicle,
      externalDriverName: isExternalVehicle ? data.externalDriverName : null,
      isClosed,
    }).returning();

    // Send Push Notification if assigned to a driver
    if (!isExternalVehicle && newOrder.driverId) {
      const [driver] = await db.select().from(drivers).where(eq(drivers.id, newOrder.driverId));
      if (driver && driver.expoPushToken) {
        await sendPushNotification(
          driver.expoPushToken,
          "Новый заказ!",
          `Вам назначен новый заказ. Адрес: ${address}`,
          { orderId: newOrder.id }
        );
      }
    }

    // (Removed warehouse income insert)

    // Generate dispatcher and referral expenses when order is 'completed' or closed
    if (status === 'completed' || isClosed || newPaymentStatus === 'entered' || newPaymentStatus === 'received') {
      // Dispatcher fee as expense
      if (dispatcherFee && dispatcherFee > 0 && dispatcherId) {
        await db.insert(expenses).values({
          category: 'dispatcher_salary',
          amountRub: dispatcherFee,
          note: `Услуга диспетчера за заказ #${newOrder.id}`,
          orderId: newOrder.id,
          dispatcherId: dispatcherId, // Link to dispatcher!
          operatorId: user ? user.id : null,
        });
      }

      // Referral fee
      const referralPercent = data.referralPercent ? parseInt(data.referralPercent) : null;
      if (referralPercent && referralPercent > 0) {
        const feeAmount = (paymentAmount * referralPercent) / 100;
        await db.insert(expenses).values({
          category: 'referral_fee',
          amountRub: Math.round(feeAmount),
          note: `Процент для 3-го лица (${data.referralName || 'Аноним'}) за заказ #${newOrder.id}`,
          orderId: newOrder.id,
          operatorId: user ? user.id : null,
        });
      }
    }

    revalidateTag('orders');
    revalidateTag('warehouse');
    revalidateTag('expenses');
    revalidatePath('/orders');
    revalidatePath('/dashboard');
    revalidatePath('/finance');
    revalidatePath('/warehouse');

    return { success: true };
  } catch (error: any) {
    console.error("Error creating order:", error);
    return { success: false, error: error.message || "Unknown database error occurred" };
  }
}

export async function updateOrder(id: number, data: any) {
  try {
    const user = await getCurrentUser();
    const isExternalVehicle = !!data.isExternalVehicle;
    const containerSizeM3 = isExternalVehicle ? 8 : parseInt(data.containerSizeM3);
    const paymentAmount = parseInt(String(data.paymentAmount).replace(/\D/g, '')) || 0;
    const clientCategory = isExternalVehicle ? 'direct' : (data.clientCategory || 'direct');

    // --- Resolve clientId (upsert inline if needed) ---
    let clientId: number | null = null;
    if (!isExternalVehicle) {
      if (data.clientId === 'new' || !data.clientId) {
        if (!data.clientName || !data.clientPhone) {
          return { success: false, error: "Пожалуйста, укажите имя и телефон клиента" };
        }
        const [newClient] = await db.insert(clients).values({
          name: data.clientName,
          phone: data.clientPhone,
          address: data.clientAddress || data.address,
          mapUrl: data.clientMapUrl || null,
        }).returning();
        clientId = newClient.id;
        revalidateTag('clients');
      } else {
        clientId = parseInt(data.clientId);
        if (data.clientName || data.clientPhone) {
          await db.update(clients).set({
            name: data.clientName,
            phone: data.clientPhone,
            address: data.clientAddress || data.address,
            mapUrl: data.clientMapUrl || null,
          }).where(eq(clients.id, clientId));
          revalidateTag('clients');
        }
      }
    }

    // --- Resolve dispatcherId ---
    let dispatcherId: number | null = null;
    if (!isExternalVehicle && clientCategory === 'dispatcher') {
      if (data.dispatcherId === 'new' || !data.dispatcherId) {
        if (data.dispatcherName && data.dispatcherPhone) {
          const [newDisp] = await db.insert(dispatchers).values({
            name: data.dispatcherName,
            phone: data.dispatcherPhone,
          }).returning();
          dispatcherId = newDisp.id;
          revalidateTag('dispatchers');
        }
      } else {
        dispatcherId = parseInt(data.dispatcherId);
        if (data.dispatcherName || data.dispatcherPhone) {
          await db.update(dispatchers).set({
            name: data.dispatcherName,
            phone: data.dispatcherPhone,
          }).where(eq(dispatchers.id, dispatcherId));
          revalidateTag('dispatchers');
        }
      }
    }

    if (!isExternalVehicle) {
      if (isNaN(clientId!)) {
        return { success: false, error: "Пожалуйста, выберите клиента" };
      }
      if (!data.address || data.address.trim() === '') {
        return { success: false, error: "Пожалуйста, укажите адрес" };
      }
      if (isNaN(containerSizeM3)) {
        return { success: false, error: "Пожалуйста, укажите корректный размер контейнера" };
      }
    }
    if (isNaN(paymentAmount)) {
      return { success: false, error: "Пожалуйста, укажите корректную сумму оплаты" };
    }

    // get order first
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) {
      return { success: false, error: "Заказ не найден / Buyurtma topilmadi" };
    }

    // --- Driver Availability Check ---
    const parsedScheduledAt = parseDate(data.scheduledAt);
    if (!isExternalVehicle && data.driverId) {
      const driverIdInt = parseInt(data.driverId);
      const scheduledTime = parsedScheduledAt.getTime();
      const BUFFER = 3 * 60 * 60 * 1000;
      
      const driverActiveOrders = await db.select().from(orders).where(eq(orders.driverId, driverIdInt));
      for (const ao of driverActiveOrders) {
        if (ao.status === 'completed' || ao.id === id) continue;
        const aoTime = new Date(ao.scheduledAt).getTime();
        if (Math.abs(aoTime - scheduledTime) <= BUFFER) {
          return { success: false, error: "Ошибка: Водитель занят в это время (±3 часа)! Пожалуйста, выберите другое время или водителя." };
        }
      }
    }

    const previousPaymentStatus = order.paymentStatus;
    const previousStatus = order.status;
    const newPaymentStatus = isExternalVehicle ? 'entered' : data.paymentStatus;
    const dispatcherFee = isExternalVehicle ? null : (data.dispatcherFee ? parseInt(String(data.dispatcherFee).replace(/\D/g, '')) : null);
    const status = isExternalVehicle ? 'completed' : data.status;
    const isClosed = isExternalVehicle ? true : data.isClosed;
    const address = isExternalVehicle ? (data.address || 'База') : data.address;

    await db.update(orders).set({
      clientId,
      driverId: (!isExternalVehicle && data.driverId) ? parseInt(data.driverId) : null,
      operatorNote: data.operatorNote,
      address,
      mapUrl: isExternalVehicle ? null : (data.mapUrl || null),
      scheduledAt: parseDate(data.scheduledAt),
      containerSizeM3,
      containerNumber: isExternalVehicle ? null : (data.containerNumber || null),
      rentalDuration: isExternalVehicle ? '1 день' : data.rentalDuration,
      status,
      paymentAmount,
      paymentType: data.paymentType,
      paymentStatus: newPaymentStatus,
      clientCategory,
      dispatcherId,
      dispatcherFee,
      referralName: isExternalVehicle ? null : data.referralName,
      referralPercent: isExternalVehicle ? null : (data.referralPercent ? parseInt(data.referralPercent) : null),
      isExternalVehicle,
      externalDriverName: isExternalVehicle ? data.externalDriverName : null,
      isClosed,
    }).where(eq(orders.id, id));

    // Send Push Notification if driver changed or assigned
    if (!isExternalVehicle && data.driverId && order.driverId !== parseInt(data.driverId)) {
      const [driver] = await db.select().from(drivers).where(eq(drivers.id, parseInt(data.driverId)));
      if (driver && driver.expoPushToken) {
        await sendPushNotification(
          driver.expoPushToken,
          "Новый заказ!",
          `Вам назначен новый заказ. Адрес: ${address}`,
          { orderId: id }
        );
      }
    }

    // (Removed warehouse income insert)

    // If completed or closed, add dispatcher fee and referral fee as expenses
    if (status === 'completed' || isClosed || newPaymentStatus === 'entered' || newPaymentStatus === 'received') {
      // Dispatcher fee as expense
      if (dispatcherFee && dispatcherFee > 0 && dispatcherId) {
        const [existingDisp] = await db.select().from(expenses).where(
          and(eq(expenses.orderId, id), eq(expenses.category, 'dispatcher_salary'))
        );
        if (!existingDisp) {
          await db.insert(expenses).values({
            category: 'dispatcher_salary',
            amountRub: dispatcherFee,
            note: `Услуга диспетчера за заказ #${id}`,
            orderId: id,
            dispatcherId: dispatcherId, // Link to dispatcher!
            operatorId: user ? user.id : null,
          });
        } else {
          // If it exists, update it in case dispatcherId or dispatcherFee changed
          await db.update(expenses).set({
            amountRub: dispatcherFee,
            dispatcherId: dispatcherId,
          }).where(eq(expenses.id, existingDisp.id));
        }
      }

      // Referral fee
      const referralPercent = data.referralPercent ? parseInt(data.referralPercent) : null;
      if (referralPercent && referralPercent > 0) {
        const [existingRef] = await db.select().from(expenses).where(
          and(eq(expenses.orderId, id), eq(expenses.category, 'referral_fee'))
        );
        const feeAmount = Math.round((paymentAmount * referralPercent) / 100);
        if (!existingRef) {
          await db.insert(expenses).values({
            category: 'referral_fee',
            amountRub: feeAmount,
            note: `Процент для 3-го лица (${data.referralName || 'Аноним'}) за заказ #${id}`,
            orderId: id,
            operatorId: user ? user.id : null,
          });
        } else {
          // Update existing referral fee amount and note
          await db.update(expenses).set({
            amountRub: feeAmount,
            note: `Процент для 3-го лица (${data.referralName || 'Аноним'}) за заказ #${id}`,
          }).where(eq(expenses.id, existingRef.id));
        }
      }
    }

    revalidateTag('orders');
    revalidateTag('warehouse');
    revalidateTag('expenses');
    revalidatePath('/orders');
    revalidatePath(`/orders/${id}`);
    revalidatePath('/dashboard');
    revalidatePath('/finance');
    revalidatePath('/warehouse');

    return { success: true };
  } catch (error: any) {
    console.error("Error updating order:", error);
    return { success: false, error: error.message || "Unknown database error occurred" };
  }
}

export async function getRecentOrders() {
  try {
    const rows = await db.select({
      id: orders.id,
      address: orders.address,
      paymentAmount: orders.paymentAmount,
      isExternalVehicle: orders.isExternalVehicle,
      externalDriverName: orders.externalDriverName,
      clientName: clients.name,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .orderBy(desc(orders.id));
    return rows;
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    return [];
  }
}
