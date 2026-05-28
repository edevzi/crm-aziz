import { db } from './db';
import { clients, drivers, orders, expenses, fuelLogs, warehouseTransactions, users, sessions, dispatchers, safeTransactions, utilizationLogs, gasStationInbounds } from './schema';

type OrderStatus = 'new' | 'assigned' | 'in_progress' | 'container_placed' | 'picked_up' | 'completed';

function dayOffset(offset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function atTimeOnDay(day: Date, hours: number, minutes = 0): Date {
  const d = new Date(day);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

async function seed() {
  console.log('Clearing all tables...');
  await db.delete(gasStationInbounds);
  await db.delete(sessions);
  await db.delete(expenses);
  await db.delete(fuelLogs);
  await db.delete(utilizationLogs);
  await db.delete(warehouseTransactions);
  await db.delete(orders);
  await db.delete(safeTransactions);
  await db.delete(clients);
  await db.delete(dispatchers);
  await db.delete(drivers);
  await db.delete(users);

  console.log('Inserting users (1 Admin, 1 Operator)...');
  const [adminUser] = await db.insert(users).values({
    username: 'admin',
    password: 'admin1234',
    name: 'Admin Axror',
    role: 'admin',
  }).returning();

  const [operatorUser] = await db.insert(users).values({
    username: 'operator',
    password: 'op1234',
    name: 'Operator Aziz',
    role: 'operator',
  }).returning();

  console.log('Inserting 3 drivers...');
  const insertedDrivers = await db.insert(drivers).values([
    { name: 'Farhod', phone: '+998901111111', vehiclePlate: '01A111AA', username: 'farhod', password: '123' },
    { name: 'Jasur', phone: '+998902222222', vehiclePlate: '01B222BB', username: 'jasur', password: '123' },
    { name: 'Sherzod', phone: '+998903333333', vehiclePlate: '01C333CC', username: 'sherzod', password: '123' },
  ]).returning();

  console.log('Inserting 5 clients...');
  const insertedClients = await db.insert(clients).values([
    { name: 'OOO PromWaste', phone: '+998931234567', address: 'Ташкент, Яккасарайский р-н' },
    { name: 'OOO EcoClean', phone: '+998947654321', address: 'Ташкент, Мирзо-Улугбекский р-н' },
    { name: 'OOO BioTrash', phone: '+998959998877', address: 'Ташкент, Чиланзарский р-н' },
    { name: 'OOO GreenCity', phone: '+998908887766', address: 'Ташкент, Юнусабадский р-н' },
    { name: 'Chilonzor Savdo', phone: '+998912223344', address: 'Ташкент, Учтепинский р-н' },
  ]).returning();

  console.log('Inserting 2 dispatchers...');
  const insertedDispatchers = await db.insert(dispatchers).values([
    { name: 'Dilshod Dispatcher', phone: '+998904444444' },
    { name: 'Malika Dispatcher', phone: '+998905555555' },
  ]).returning();

  const externalDriverNames = ['Баходир', 'Сарвар', 'Жамшид', 'Мурод', 'Хуршид', 'Анвар'];
  const containerSizes = [8, 20, 27];
  const paymentTypes = ['cash', 'card', 'online'] as const;

  console.log('Generating realistic 30-day transactional history...');
  
  // Keep order counter for deterministic generation
  let counter = 0;

  for (let daysBack = 30; daysBack >= 0; daysBack--) {
    const day = dayOffset(-daysBack);
    // 2 to 4 entries per day
    const entriesToday = 2 + (counter % 3);
    
    for (let i = 0; i < entriesToday; i++) {
      counter++;
      const hour = 8 + i * 3 + (counter % 2);
      const scheduledAt = atTimeOnDay(day, hour, 0);
      const createdAt = atTimeOnDay(day, hour - 1, 0);
      const opUser = operatorUser; // All orders belong to operator
      const isExternal = (counter % 4 === 0); // 25% of orders are external vehicles

      if (isExternal) {
        // External vehicle dump arrival
        const paymentAmount = 100000 + (counter % 5) * 20000; // 100k - 180k
        const extDriverName = externalDriverNames[counter % externalDriverNames.length];
        const payType = paymentTypes[counter % paymentTypes.length];

        const [order] = await db.insert(orders).values({
          clientId: null,
          driverId: null,
          operatorNote: `Сброс мусора (Внешний авто) - Водитель: ${extDriverName}`,
          address: 'База',
          mapUrl: null,
          scheduledAt,
          containerSizeM3: 8,
          containerNumber: null,
          rentalDuration: '1 день',
          status: 'completed',
          paymentAmount,
          paymentType: payType,
          paymentStatus: 'entered',
          clientCategory: 'direct',
          dispatcherId: null,
          dispatcherFee: null,
          referralName: null,
          referralPercent: null,
          isExternalVehicle: true,
          externalDriverName: extDriverName,
          isClosed: true,
          operatorId: opUser.id,
          createdAt,
          updatedAt: createdAt
        }).returning();

        // Warehouse income removed for external vehicles as warehouse tracks only volume now

      } else {
        // Standard order flow
        const client = insertedClients[counter % insertedClients.length];
        const driver = insertedDrivers[counter % insertedDrivers.length];
        const containerSizeM3 = containerSizes[counter % containerSizes.length];
        const isDispatcher = (counter % 5 === 2); // 20% are dispatchers
        const isReferral = (counter % 5 === 3);   // 20% have referrals
        const payType = paymentTypes[counter % paymentTypes.length];
        
        let paymentAmount = 180000 + (counter % 6) * 30000; // 180k - 330k
        let dispatcherId = null;
        let dispatcherFee = null;
        let referralName = null;
        let referralPercent = null;

        if (isDispatcher) {
          dispatcherId = insertedDispatchers[counter % insertedDispatchers.length].id;
          dispatcherFee = 30000 + (counter % 3) * 10000; // 30k - 50k
          paymentAmount += dispatcherFee; // higher amount to cover dispatcher fee
        } else if (isReferral) {
          referralName = 'Брокер Музаффар';
          referralPercent = 10; // 10% referral fee
        }

        let status: OrderStatus = 'completed';
        let paymentStatus: 'pending' | 'received' | 'entered' = 'entered';
        let isClosed = true;
        let updatedAt = createdAt;

        if (daysBack === 0) {
          const todayCycle = counter % 7;
          if (todayCycle === 0) {
            status = 'new';
            paymentStatus = (payType !== 'cash') ? 'entered' : 'pending';
            isClosed = false;
          } else if (todayCycle === 1) {
            status = 'assigned';
            paymentStatus = (payType !== 'cash') ? 'entered' : 'pending';
            isClosed = false;
          } else if (todayCycle === 2) {
            status = 'in_progress';
            paymentStatus = (payType !== 'cash') ? 'entered' : 'pending';
            isClosed = false;
          } else if (todayCycle === 3) {
            // Overdue container (placed 3 hours ago)
            status = 'container_placed';
            paymentStatus = (payType !== 'cash') ? 'entered' : 'pending';
            isClosed = false;
            updatedAt = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago (overdue!)
          } else if (todayCycle === 4) {
            // Active container (placed 30 minutes ago)
            status = 'container_placed';
            paymentStatus = (payType !== 'cash') ? 'entered' : 'pending';
            isClosed = false;
            updatedAt = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago (active!)
          } else if (todayCycle === 5) {
            status = 'picked_up';
            paymentStatus = (payType !== 'cash') ? 'entered' : 'pending';
            isClosed = false;
          } else {
            status = 'completed';
            paymentStatus = 'entered';
            isClosed = true;
          }
        } else if (daysBack === 1) {
          const statusCycle = counter % 3;
          if (statusCycle === 0) {
            status = 'completed';
            paymentStatus = 'entered';
            isClosed = true;
          } else if (statusCycle === 1) {
            status = 'completed';
            paymentStatus = 'entered';
            isClosed = true;
          } else {
            // Yesterday's overdue container
            status = 'container_placed';
            paymentStatus = (payType !== 'cash') ? 'entered' : 'pending';
            isClosed = false;
            updatedAt = new Date(Date.now() - 26 * 60 * 60 * 1000); // Placed yesterday (overdue!)
          }
        }

        const [order] = await db.insert(orders).values({
          clientId: client.id,
          driverId: driver.id,
          operatorNote: `Стандартный вывоз контейнера ${containerSizeM3}м3`,
          address: client.address,
          mapUrl: `https://yandex.ru/maps/?pt=69.2401,41.2995&z=12`,
          scheduledAt,
          containerSizeM3,
          containerNumber: `КТ-${100 + counter}`,
          rentalDuration: (counter % 3 === 0) ? '1 день' : (counter % 3 === 1 ? '1 неделя' : '1 месяц'),
          status,
          paymentAmount,
          paymentType: payType,
          paymentStatus,
          clientCategory: isDispatcher ? 'dispatcher' : 'direct',
          dispatcherId,
          dispatcherFee,
          referralName,
          referralPercent,
          isExternalVehicle: false,
          externalDriverName: null,
          isClosed,
          operatorId: opUser.id,
          createdAt,
          updatedAt: updatedAt
        }).returning();

        // Only log transactions and expenses if the order is completed
        if (status === 'completed') {
          // Log warehouse transaction (inbound)
          await db.insert(warehouseTransactions).values({
            type: 'inbound',
            volumeM3: containerSizeM3,
            containerSizeM3: containerSizeM3,
            containerCount: 1,
            note: `Автоматический приход с заказа #${order.id}`,
            orderId: order.id,
            operatorId: opUser.id,
            recordedAt: createdAt
          });

          // Dispatcher Fee Expense
          if (dispatcherFee && dispatcherFee > 0) {
            await db.insert(expenses).values({
              category: 'dispatcher_salary',
              amountRub: dispatcherFee,
              note: `Услуга диспетчера за заказ #${order.id}`,
              dispatcherId: dispatcherId,
              orderId: order.id, // Set orderId!
              operatorId: opUser.id,
              recordedAt: createdAt
            });
          }

          // Referral Fee Expense
          if (referralPercent && referralPercent > 0) {
            const referralAmount = Math.round((paymentAmount * referralPercent) / 100);
            await db.insert(expenses).values({
              category: 'referral_fee',
              amountRub: referralAmount,
              note: `Процент для 3-го лица (${referralName}) за заказ #${order.id}`,
              orderId: order.id, // Set orderId!
              operatorId: opUser.id,
              recordedAt: createdAt
            });
          }
        }
      }
    }

    // Daily expenses & driver fuel logs
    const opUser = operatorUser; // All expenses belong to operator
    const expenseDate = atTimeOnDay(day, 18, 0);

    // Fuel log for a driver every day
    const activeDriver = insertedDrivers[daysBack % insertedDrivers.length];
    const fuelLiters = 40 + (daysBack % 5) * 10; // 40L - 80L
    const fuelCost = fuelLiters * 110; // 4400 - 8800 RUB

    await db.insert(fuelLogs).values({
      driverId: activeDriver.id,
      stationName: `АЗС Мустанг-${(daysBack % 3) + 1}`,
      liters: fuelLiters,
      priceRub: fuelCost,
      vehicle: activeDriver.vehiclePlate,
      operatorId: opUser.id,
      loggedAt: expenseDate
    });

    // Auto generated fuel expense
    await db.insert(expenses).values({
      category: 'fuel',
      amountRub: fuelCost,
      note: `Автоматически добавлено из заправки: ${activeDriver.vehiclePlate} (${fuelLiters}L)`,
      driverId: activeDriver.id,
      liters: fuelLiters,
      operatorId: opUser.id,
      recordedAt: expenseDate
    });

    // Driver salary payout once a week
    if (daysBack % 7 === 0) {
      await db.insert(expenses).values({
        category: 'driver_salary',
        amountRub: 150000,
        note: `Зарплата водителя ${activeDriver.name} за неделю`,
        driverId: activeDriver.id,
        operatorId: opUser.id,
        recordedAt: expenseDate
      });
    }

    // Base Rent once a month
    if (daysBack === 15) {
      await db.insert(expenses).values({
        category: 'base_rent',
        amountRub: 500000,
        note: `Ежемесячная аренда базы заезда`,
        operatorId: opUser.id,
        recordedAt: expenseDate
      });
    }

    // Utilization fee every 3 days
    if (daysBack % 3 === 0) {
      await db.insert(expenses).values({
        category: 'utilization',
        amountRub: 120000,
        note: `Оплата за свалку / утилизацию отходов`,
        operatorId: opUser.id,
        recordedAt: expenseDate
      });

      // Also log an outbound transaction since waste is being utilized
      await db.insert(warehouseTransactions).values({
        type: 'outbound',
        volumeM3: 30,
        containerSizeM3: 30,
        containerCount: 1,
        note: 'Вывоз на свалку (Утилизация)',
        operatorId: opUser.id,
        recordedAt: expenseDate
      });
    }

    // GAI (fines and compliance) every 7 days
    if (daysBack % 7 === 2) {
      await db.insert(expenses).values({
        category: 'gai',
        amountRub: 15000 + (daysBack % 4) * 5000, // 15,000 - 30,000
        note: `Штраф ГАИ / Оплата техосмотра и разрешений для ТС ${activeDriver.vehiclePlate}`,
        driverId: activeDriver.id,
        operatorId: opUser.id,
        recordedAt: expenseDate
      });
    }

    // Other general daily expenses
    if (daysBack % 4 === 1) {
      const isDriverAssigned = (daysBack % 8 === 1);
      await db.insert(expenses).values({
        category: 'spare_parts',
        amountRub: 25000 + (daysBack % 3) * 15000,
        note: isDriverAssigned
          ? `Закупка запчастей для автомобиля водителя ${activeDriver.name}`
          : `Закупка расходников и запчастей для автопарка`,
        driverId: isDriverAssigned ? activeDriver.id : null,
        operatorId: opUser.id,
        recordedAt: expenseDate
      });
    }
  }

  console.log('Seeding process completed successfully!');
  console.log(`Admin User: admin / admin1234`);
  console.log(`Operator User: operator / op1234`);
}

seed().catch((err) => {
  console.error('Seed execution error:', err);
  process.exit(1);
});
