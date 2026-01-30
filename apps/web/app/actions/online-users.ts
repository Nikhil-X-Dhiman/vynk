// 'use server';

// import { getOnlineUsers as dbGetOnlineUsers } from '@repo/db';
// import { auth } from '@/lib/auth/auth-server';
// import { headers } from 'next/headers';

// export async function getOnlineUsers() {
//   try {
//     const session = await auth.api.getSession({
//       headers: await headers(),
//     });

//     if (!session) {
//       return { success: false, error: 'Unauthorized' };
//     }

//     const onlineUsers = await dbGetOnlineUsers();

//     // Filter out self
//     const otherOnlineUsers = onlineUsers.filter(u => u.id !== session.user.id);

//     return { success: true, data: otherOnlineUsers };
//   } catch (error) {
//     console.error('Failed to get online users:', error);
//     return { success: false, error: 'Failed to fetch online users' };
//   }
// }
