import { idbStorage } from '@/lib/utils/indexeddb-store';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { loginStoreTypes } from './types';

const useLoginStore = create(
  persist<loginStoreTypes>(
    (set) => ({
      // states
      step: 1,
      phoneNumber: '',
      countryCode: '',
      avatarURL: '',
      about: '',
      name: '',

      // actions
      setStep: (step: number) => {
        set({ step });
      },
      setPhoneNumber: (phoneNumber: string) => {
        set({ phoneNumber });
      },

      setCountryCode: (countryCode: string) => {
        set({ countryCode });
      },
      // otpCode: '',
      // setOtpCode: (otpCode: string) => {
      //   set({ otpCode });
      // },

      setAvatarURL: (avatarURL: string) => {
        set({ avatarURL });
      },

      setAbout: (about: string) => {
        set({ about });
      },

      setName: (name: string) => {
        set({ name });
      },
      reset: () => {
        set({
          step: 1,
          phoneNumber: '',
          countryCode: '',
          avatarURL: '',
          about: '',
          name: '',
        });
      },
    }),
    {
      name: 'login-storage', // unique name for the IndexedDB key
      storage: createJSONStorage(() => idbStorage), // Use the custom IDB storage
    }
  )
);

export { useLoginStore }; // Use the custom IDB storage
