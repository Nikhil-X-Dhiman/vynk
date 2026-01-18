'use client';
import LoginForm from '../pages/LoginForm';
import OTPForm from '../pages/OtpForm';
import AvatarLogin from '../pages/AvatarLogin';
import { useLoginStore } from '@/store/login';
import { useAuthStore } from '@/store/auth';
import { getCurrentSession } from '@/lib/auth/get-session';
import { log } from 'console';
import { useEffect } from 'react';

function AuthFlow() {
  const { data, isPending } = getCurrentSession();
  const session = useAuthStore((state) => state.session);
  const setUser = useAuthStore((state) => state.setUser);
  const setSession = useAuthStore((state) => state.setSession);
  useEffect(() => {
    if (data != null) {
      setUser(data.user);
      setSession(data.session);
    }
  }, [data, setUser, setSession]);
  const phoneNumber = useLoginStore((state) => state.phoneNumber);
  const step = useLoginStore((state) => state.step);

  // const [phoneNumber, setPhoneNumber] = useState<string>('');
  if (isPending) {
    return <h1>Loading Session!!!</h1>;
  }
  return (
    <>
      {console.log(step)}
      {step == 1 && <LoginForm />}

      {step == 2 && phoneNumber && <OTPForm />}

      {step == 3 && session && <AvatarLogin />}
    </>
  );
}

export default AuthFlow;
