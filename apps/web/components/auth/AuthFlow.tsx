'use client';
import PhoneNumberStep from './PhoneNumberStep';
import OTPStep from './OTPStep';
import ProfileStep from './ProfileStep';
import { useLoginStore } from '@/store/login';
import { useAuthStore } from '@/store/auth';

function AuthFlow() {
  const session = useAuthStore((state) => state.session);
  const phoneNumber = useLoginStore((state) => state.phoneNumber);
  const step = useLoginStore((state) => state.step);

  return (
    <div className="w-full max-w-md mx-auto">
      {step === 1 && <PhoneNumberStep key="phone-step" />}
      {step === 2 && phoneNumber && <OTPStep key="otp-step" />}
      {step === 3 && session && <ProfileStep key="profile-step" />}
    </div>
  );
}

export default AuthFlow;
