import { PrismaClient } from '@prisma/client';
import { getFirebaseAdmin } from '../src/lib/fcm';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      deviceTokens: {
        isEmpty: false
      }
    }
  });

  const allTokens = users.flatMap(u => u.deviceTokens);
  
  if (allTokens.length === 0) {
    console.log('No users with device tokens found.');
    process.exit(0);
  }

  console.log(`Found ${allTokens.length} tokens. Sending push notification...`);

  const firebase = getFirebaseAdmin();
  if (!firebase) {
    console.error('Firebase Admin not initialized');
    process.exit(1);
  }

  const messaging = firebase.messaging();
  const response = await messaging.sendEachForMulticast({
    tokens: allTokens,
    notification: {
      title: 'EduNest Test',
      body: 'This is a test push notification to verify the FCM setup!'
    },
    webpush: {
      notification: {
        title: 'EduNest Test',
        body: 'This is a test push notification to verify the FCM setup!'
      },
      fcmOptions: {
        link: '/'
      },
      data: {
        link: '/'
      }
    }
  });

  console.log(`Successfully sent ${response.successCount} messages.`);
  console.log(`Failed to send ${response.failureCount} messages.`);
  if (response.failureCount > 0) {
    response.responses.forEach((res, idx) => {
      if (!res.success) {
        console.error(`Error sending to token ${allTokens[idx]}:`, res.error);
      }
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
