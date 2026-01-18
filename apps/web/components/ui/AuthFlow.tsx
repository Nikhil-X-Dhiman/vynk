'use client';
import LoginForm from '../pages/LoginForm';
import OTPForm from '../pages/OtpForm';
import AvatarLogin from '../pages/AvatarLogin';
import { useLoginStore } from '@/store/login';
import { useAuthStore } from '@/store/auth';
import { log } from 'console';

function AuthFlow() {
  const session = useAuthStore((state) => state.session);
  const phoneNumber = useLoginStore((state) => state.phoneNumber);
  const step = useLoginStore((state) => state.step);

  // const [phoneNumber, setPhoneNumber] = useState<string>('');

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
