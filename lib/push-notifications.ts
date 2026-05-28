import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export async function sendPushNotification(expoPushToken: string | null, title: string, body: string, data: any = {}) {
  if (!expoPushToken || !Expo.isExpoPushToken(expoPushToken)) {
    console.warn(`Invalid or missing Expo push token: ${expoPushToken}`);
    return;
  }

  const messages: ExpoPushMessage[] = [
    {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    },
  ];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }
    return tickets;
  } catch (error) {
    console.error('Error preparing push notifications:', error);
  }
}
