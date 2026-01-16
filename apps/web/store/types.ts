import { Session, User } from 'better-auth';

type loginStoreTypes = {
  step: number;
  setStep: (step: number) => void;
  phoneNumber: string;
  setPhoneNumber: (phoneNumber: string) => void;
  countryCode: string;
  setCountryCode: (countryCode: string) => void;
  // otpCode: string;
  // setOtpCode: (otpCode: string) => void;
  avatarURL: string;
  setAvatarURL: (avatarURL: string) => void;
  name: string;
  setName: (name: string) => void;
  about: string;
  setAbout: (description: string) => void;
  reset: () => void;
};

type authStoreTypes = {
  session?: Session | null;
  user?: User | null;
  isAuthenticated: boolean;
  toggleIsAuthenticated: () => void;
  setUser: (user: User) => void;
  setSession: (session: Session) => void;
  reset: () => void;
};

export type { loginStoreTypes, authStoreTypes };
