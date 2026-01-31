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
    <div className="w-full max-w-md mx-auto flex flex-col justify-center">
      <div
        key={step}
        className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-500"
      >
        {step === 1 && <PhoneNumberStep key="phone-step" />}
        {step === 2 && phoneNumber && <OTPStep key="otp-step" />}
        {step === 3 && session && <ProfileStep key="profile-step" />}
        {/* Fallback: If something goes wrong */}
        {step === 2 && !phoneNumber && (
          <p className="text-center text-sm text-destructive">
            Error: Session lost. Please restart.
          </p>
        )}
      </div>
    </div>
  );
}

export default AuthFlow;
