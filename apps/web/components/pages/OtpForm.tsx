'use client';
import { formOptions, useForm } from '@tanstack/react-form';
import { useTransition } from 'react';
import { Field, FieldGroup } from '../ui/field';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '../ui/input-otp';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Button } from '../ui/button';
import { handleGetUserAction } from '@/app/actions/auth-actions';
import { useLoginStore } from '@/store';
import { authClient } from '@/lib/auth/auth-client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Spinner } from '../ui/spinner';
import { useAuthStore } from '@/store/auth';

interface Otp {
  otp: string;
}

const defaultValues: Otp = {
  otp: '',
};

const formOpts = formOptions({
  defaultValues,
});

function OTPForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const phoneNumber = useLoginStore((state) => state.phoneNumber);
  const countryCode = useLoginStore((state) => state.countryCode);
  const setStep = useLoginStore((state) => state.setStep);
  const setUser = useAuthStore((state) => state.setUser);
  const toggleIsAuthenticated = useAuthStore(
    (store) => store.toggleIsAuthenticated
  );
  // const [state, formAction, isPending] = useActionState(verifyOTPAction, {
  //   success: false,
  //   message: '',
  // });
  const form = useForm({
    ...formOpts,
    validators: {
      onSubmit: ({ value }) => {
        console.log('Form Validation upon OTP Submission', value.otp);
      },
    },
    onSubmit: async ({ value }) => {
      console.log('Form Upon OTP Submission', value.otp);
      // // formAction(value);
      // const fd = new FormData();
      // fd.append('otp', value.otp);
      // fd.append('phonePrefix', countryCode);
      // fd.append('phoneNumber', phoneNumber);
      // console.log('transition starting');
      // startTransition(() => {
      //   setStep(3);
      //   formAction(fd);
      // });
      startTransition(async () => {
        const fullPhoneNumber = `${countryCode}${phoneNumber}`;
        const { data, error } = await authClient.phoneNumber.verify({
          phoneNumber: fullPhoneNumber,
          code: value.otp,
        });

        if (!error) {
          // set data in the zustand
          setUser(data?.user);
          toggleIsAuthenticated();

          const fd = new FormData();
          fd.append('phoneNumber', phoneNumber);
          fd.append('countryCode', countryCode);
          const { success, message, user } = await handleGetUserAction(fd);
          if (success) {
            // TODO: Enter user name in greetings
            toast.success('Welcome Back');
            router.push('/chats');
          } else {
            // navigate to onboarding for username & profile pic
            setStep(3);
          }
        } else {
          toast.error('Unable to send OTP', {
            description: `${error.message}`,
          });
        }
      });
    },
  });
  return (
    <>
      <form
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        // action={formAction}
      >
        <FieldGroup>
          <form.Field name="otp">
            {(field) => {
              return (
                <Field>
                  <InputOTP
                    name="otp"
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS}
                    value={field.state.value}
                    onChange={(value) => field.handleChange(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  {!field.state.meta.isValid && (
                    <p className="text-red-500 text-xs">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isPending || isSubmitting}
              className="w-full mt-4"
              variant={'outline'}
              aria-label="verify-otp"
            >
              {isSubmitting ? <Spinner /> : 'Verify OTP'}
            </Button>
          )}
        </form.Subscribe>
      </form>
      {/*! Delete this code line */}
      <Button variant={'destructive'}>Wrong Number? Go Back</Button>
    </>
  );
}

export default OTPForm;
