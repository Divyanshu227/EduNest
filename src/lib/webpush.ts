import webpush from 'web-push';

export function initializeWebPush() {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('[WebPush] Missing VAPID keys. Push notifications disabled.');
    return false;
  }

  const contact = 'mailto:admin@edunest.com';

  webpush.setVapidDetails(
    contact,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  return true;
}

export async function sendPushToSubscription(subscription: any, payload: any) {
  if (!initializeWebPush()) {
    return false;
  }

  try {
    const stringPayload = JSON.stringify({
      notification: {
        title: payload.title,
        body: payload.body,
        data: {
          url: payload.link || '/'
        }
      }
    });

    await webpush.sendNotification(subscription, stringPayload);
    return true;
  } catch (error: any) {
    console.error('[WebPush] Error sending notification:', error?.statusCode || error);
    return false;
  }
}
