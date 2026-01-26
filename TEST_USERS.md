# Create Test Users

Open your browser console on the deployed app and run:

```javascript
// Import Firebase
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Test users
const users = [
  { email: 'jack@gmail.com', password: 'jacknytro123', username: 'Jack' },
  { email: 'nytro@gmail.com', password: 'jacknytro123', username: 'Nytro' }
];

// Create them
for (const user of users) {
  try {
    const cred = await firebase.auth().createUserWithEmailAndPassword(user.email, user.password);
    await firebase.firestore().collection('users').doc(cred.user.uid).set({
      id: cred.user.uid,
      email: user.email,
      username: user.username,
      joinedGroups: ['system-updates'],
      createdAt: Date.now(),
      sessions: []
    });
    console.log('✅ Created:', user.email);
  } catch (e) {
    console.log('⚠️', user.email, e.message);
  }
}
```

## Or Just Sign Up Normally

1. Go to your app
2. Click "Create Account"
3. Enter: `jack@gmail.com`
4. Password: `jacknytro123`
5. Username: `Jack`

Repeat for `nytro@gmail.com` / `Nytro`
