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
    console.error('[FCM] Missing environment variables:', {
      projectId: !!process.env.FCM_PROJECT_ID,
      clientEmail: !!process.env.FCM_CLIENT_EMAIL,
      privateKey: !!process.env.FCM_PRIVATE_KEY
    });
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
    console.log('[FCM] Skipping push. Firebase initialized:', !!firebase, 'Tokens length:', tokens.length);
    return null;
  }

  const messaging = firebase.messaging();
  const chunkSize = 500;
  const responses = [];
  
  for (let i = 0; i < tokens.length; i += chunkSize) {
    const chunk = tokens.slice(i, i + chunkSize);
    try {
      const response = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: {
          title: payload.title,
          body: payload.body
        },
        webpush: {
          notification: {
            title: payload.title,
            body: payload.body
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
      console.log(`[FCM] Sent multicast to ${chunk.length} tokens. Success: ${response.successCount}, Failure: ${response.failureCount}`);
      if (response.failureCount > 0) {
        response.responses.forEach((res, idx) => {
          if (!res.success) {
            console.error(`[FCM] Failed to send to token ${chunk[idx]}:`, res.error);
          }
        });
      }
    } catch (err) {
      console.error('[FCM] Error sending multicast:', err);
    }
  }
  
  return responses;
}
