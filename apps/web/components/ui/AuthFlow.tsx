'use client';
import React, { useState } from 'react';
import { authClient, Session, User } from '@/lib/auth/auth-client';
import LoginForm from '../pages/LoginForm';
import OTPForm from '../pages/OtpForm';
import AvatarLogin from '../pages/AvatarLogin';
import { useLoginStore } from '@/store/login';
import { useAuthStore } from '@/store/auth';

function AuthFlow() {
  const { data, isPending, error } = authClient.useSession();
  const session = useAuthStore((state) => state.session);
  const setUser = useAuthStore((state) => state.setUser);
  const setSession = useAuthStore((state) => state.setSession);
  if (data != null) {
    setUser(data.user);
    setSession(data.session);
  }
  const phoneNumber = useLoginStore((state) => state.phoneNumber);
  const step = useLoginStore((state) => state.step);

  // const [phoneNumber, setPhoneNumber] = useState<string>('');
  if (isPending) {
    console.log('Loading...');
    return <h1>Loading Session!!!</h1>;
  }
  return (
    <>
      {step == 1 || (!phoneNumber && <LoginForm />)}

      {step == 2 && phoneNumber && <OTPForm />}

      {step == 3 && session && <AvatarLogin />}
    </>
  );
}

export default AuthFlow;
