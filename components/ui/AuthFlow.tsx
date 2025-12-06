'use client';
import React, { useState } from 'react';
import AvatarLogin from '../AvatarLogin';
import LoginForm from '../LoginForm';
import OTPForm from '../OTPForm';

interface AuthFlowProps {
  session: {
    session: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      userId: string;
      expiresAt: Date;
      token: string;
      ipAddress?: string | null | undefined | undefined;
      userAgent?: string | null | undefined | undefined;
    };
    user: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      email: string;
      emailVerified: boolean;
      name: string;
      image?: string | null | undefined | undefined;
      phoneNumber?: string | null | undefined;
      phoneNumberVerified?: boolean | null | undefined;
    };
  } | null;
}

function AuthFlow({ session }: AuthFlowProps) {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
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

      {session && <AvatarLogin />}
    </>
  );
}

export default AuthFlow;
