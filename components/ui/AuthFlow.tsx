'use client';
import React, { useState } from 'react';
import AvatarLogin from '../AvatarLogin';
import LoginForm from '../LoginForm';
import OTPForm from '../OTPForm';
import { authClient } from '@/lib/auth-client';

function AuthFlow() {
  const { data: session, isPending } = authClient.useSession();
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  if (isPending) {
    console.log('Loading...');
  }
  return (
    <>
      {!session && !phoneNumber && (
        <LoginForm setPhoneNumber={setPhoneNumber} />
      )}
      {!session && phoneNumber && <OTPForm phoneNumber={phoneNumber} />}
      {session && (
        <p>
          {session?.user.id} {session?.user.phoneNumber} {session.user.email}{' '}
          {session.user.name}
        </p>
      )}

      {session && <AvatarLogin phoneNumber={phoneNumber} />}
    </>
  );
}

export default AuthFlow;
