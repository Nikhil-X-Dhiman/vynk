'use client';

import { formOptions, useForm } from '@tanstack/react-form';
import { useTransition } from 'react';
import { FieldGroup } from '@/components/ui/field';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Button } from '@/components/ui/button';
import { handleGetUserAction } from '@/app/actions/auth-actions';
import { useLoginStore } from '@/store';
import { authClient } from '@/lib/auth/auth-client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/store/auth';
import { otpSchema } from '@repo/validation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

interface Otp {
  otp: string;
}

const defaultValues: Otp = {
  otp: '',
};

const formOpts = formOptions({
  defaultValues,
});

function OTPStep() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const phoneNumber = useLoginStore((state) => state.phoneNumber);
  const countryCode = useLoginStore((state) => state.countryCode);
  const setStep = useLoginStore((state) => state.setStep);
  const reset = useLoginStore((state) => state.reset);
  const setUser = useAuthStore((state) => state.setUser);
  const toggleIsAuthenticated = useAuthStore(
    (store) => store.toggleIsAuthenticated
  );

  const form = useForm({
    ...formOpts,
    validators: {
      onSubmit: ({ value }) => {
        const { success, error } = otpSchema.safeParse(value.otp);
        if (!success) return error.issues[0].message;
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      startTransition(async () => {
        const fullPhoneNumber = `${countryCode}${phoneNumber}`;
        const { data, error } = await authClient.phoneNumber.verify({
          phoneNumber: fullPhoneNumber,
          code: value.otp,
        });

        if (!error) {
          setUser(data?.user);
          toggleIsAuthenticated();

          const fd = new FormData();
          fd.append('phoneNumber', phoneNumber);
          fd.append('countryCode', countryCode);
          // Check if user exists in DB to decide navigation
          const { success } = await handleGetUserAction(fd);
          if (success) {
            toast.success('Welcome Back');
            router.push('/chats');
          } else {
            setStep(3);
          }
        } else {
          toast.error('Verification Failed', {
            description: `${error.message}`,
          });
        }
      });
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Verify OTP</CardTitle>
        <CardDescription className="text-center">
          Enter the code sent to <span className="font-semibold text-foreground">{countryCode}{phoneNumber}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4 flex flex-col items-center"
        >
          <FieldGroup>
            <form.Field name="otp">
              {(field) => (
                <div className="flex flex-col items-center gap-2">
                  <InputOTP
                    name="otp"
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS}
                    autoFocus
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
                    <p className="text-xs text-destructive">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          </FieldGroup>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={!canSubmit || isPending || isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-500/90 via-sky-500/90 to-teal-500/90 hover:from-indigo-600 hover:via-sky-600 hover:to-teal-600 text-white border-0 transition-all duration-500 shadow-md hover:shadow-lg active:scale-[0.98]"
                size={'lg'}
              >
                {isSubmitting || isPending ? <Spinner /> : 'Verify Code'}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Button
          variant="link"
          onClick={() => setStep(1)}
          className="text-muted-foreground hover:text-foreground gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Wrong number? Go back
        </Button>
      </CardFooter>
    </Card>
  );
}

export default OTPStep;
