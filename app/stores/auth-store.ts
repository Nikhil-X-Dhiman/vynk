import { create } from 'zustand';

type AuthStorePara = {
  phoneNumber: string;
  phoneCode: string;
  username: string;
  consent: boolean;
  updatePhoneNumber: (number: string) => void;
  updatePhoneCode: (code: string) => void;
  updateUserName: (number: string) => void;
  updateConsent: (number: boolean) => void;
};

const useAuthStore = create<AuthStorePara>((set) => ({
  phoneNumber: '',
  phoneCode: '',
  username: '',
  consent: false,
  updatePhoneNumber: (number) => set({ phoneNumber: number }),
  updatePhoneCode: (code) => set({ phoneCode: code }),
  updateUserName: (username) => set({ username }),
  updateConsent: (consent) => set({ consent }),
}));

export { useAuthStore };
