const webpush = require('web-push');

// VAPID 키 쌍 생성
const vapidKeys = webpush.generateVAPIDKeys();

console.log('=== VAPID 키 생성 완료 ===');
console.log('');
console.log('공개 키 (Public Key):');
console.log(vapidKeys.publicKey);
console.log('');
console.log('비공개 키 (Private Key):');
console.log(vapidKeys.privateKey);
console.log('');
console.log('=== .env.local 파일에 추가 ===');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('VAPID_SUBJECT=mailto:your-email@example.com');
console.log('');
console.log('위의 내용을 .env.local 파일에 추가하고 your-email@example.com을 실제 이메일로 변경하세요.');