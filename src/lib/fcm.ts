import admin from 'firebase-admin';

let app: admin.app.App | undefined;

function escapePrivateKey(value: string) {
  return value.replace(/\\n/g, '\n');
}

export function getFirebaseAdmin() {
  if (app) {
    return app;
  }

  if (!process.env.FCM_PROJECT_ID || !process.env.FCM_CLIENT_EMAIL || !process.env.FCM_PRIVATE_KEY) {
    return null;
  }

  app = admin.apps.length
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FCM_PROJECT_ID,
          clientEmail: process.env.FCM_CLIENT_EMAIL,
          privateKey: escapePrivateKey(process.env.FCM_PRIVATE_KEY)
        })
      });

  return app;
}

export async function sendPushToTokens(tokens: string[], payload: { title: string; body: string; link?: string }) {
  const firebase = getFirebaseAdmin();

  if (!firebase || tokens.length === 0) {
    return null;
  }

  const messaging = firebase.messaging();
  const chunkSize = 500;
  const responses = [];
  
  for (let i = 0; i < tokens.length; i += chunkSize) {
    const chunk = tokens.slice(i, i + chunkSize);
    const response = await messaging.sendEachForMulticast({
      tokens: chunk,
      notification: {
        title: payload.title,
        body: payload.body
      },
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: '/icon.svg',
          badge: '/icon.svg'
        },
        fcmOptions: {
          link: payload.link ?? '/'
        },
        data: {
          link: payload.link ?? '/'
        }
      }
    });
    responses.push(response);
  }
  
  return responses;
}
