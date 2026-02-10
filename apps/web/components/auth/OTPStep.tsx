/**
 * @fileoverview OTP Verification Step
 *
 * Second step of the authentication flow. Displays a 6-digit OTP input
 * and validates it against the `@repo/validation` `otpSchema`.
 *
 * Flow on successful verification:
 * - Fetches the client-side session from Better Auth
 * - Updates the Zustand auth store
 * - **Existing user** → redirects to `/chats`
 * - **New user** → advances to step 3 (profile setup)
 *
 * @module components/auth/OTPStep
 */

'use client';

import { useTransition } from 'react';
import { useForm, formOptions } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import type { User } from 'better-auth';

import { otpSchema } from '@repo/validation';
import { useLoginStore } from '@/store';
import { useAuthStore } from '@/store/auth';
import { verifyOTPAction } from '@/app/actions/login-auth';
import { authClient } from '@/lib/auth/auth-client';

import { FieldGroup } from '@/components/ui/field';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// ==========================================
// Constants
// ==========================================

/** Shared gradient button classes used across all auth steps. */
const GRADIENT_BUTTON =
  'w-full bg-linear-to-r from-indigo-500/90 via-sky-500/90 to-teal-500/90 hover:from-indigo-600 hover:via-sky-600 hover:to-teal-600 text-white border-0 transition-all duration-500 shadow-md hover:shadow-lg active:scale-[0.98]';

/** Form default values (hoisted outside the component to avoid re-creation). */
const formOpts = formOptions({ defaultValues: { otp: '' } });

// ==========================================
// Component
// ==========================================

/**
 * OTP verification form.
 *
 * Renders a 6-digit OTP input with separator, validates via Zod,
 * and calls `verifyOTPAction` on submission. Handles both returning
 * users (redirect) and new users (step transition).
 */
function OTPStep() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const phoneNumber = useLoginStore((s) => s.phoneNumber);
  const countryCode = useLoginStore((s) => s.countryCode);
  const setStep = useLoginStore((s) => s.setStep);
  const setAuth = useAuthStore((s) => s.setAuth);

  const form = useForm({
    ...formOpts,
    validators: {
      onSubmit: ({ value }) => {
        const result = otpSchema.safeParse(value.otp);
        return result.success ? undefined : result.error.issues[0]?.message;
      },
    },
    onSubmit: async ({ value }) => {
      startTransition(async () => {
        try {
          const fd = new FormData();
          fd.append('phoneNumber', phoneNumber);
          fd.append('countryCode', countryCode);
          fd.append('otp', value.otp);

          const response = await verifyOTPAction(fd);

          if (!response.success) {
            toast.error('Verification Failed', {
              description:
                response.message || 'Please check your code and try again.',
            });
            return;
          }

          // Sync client-side auth state
          await syncAuthState(response.user);

          if (response.isNewUser) {
            setStep(3);
          } else {
            toast.success('Welcome Back');
            router.push('/chats');
          }
        } catch (error) {
          console.error('[OTPStep] Verification error:', error);
          toast.error('Something went wrong', {
            description: 'Please try again.',
          });
        }
      });
    },
  });

  /**
   * Fetches the session from Better Auth on the client and updates
   * the Zustand auth store. Falls back to the server-returned user
   * if the client session fetch is delayed.
   */
  async function syncAuthState(serverUser: unknown) {
    const { data: sessionData } = await authClient.getSession();

    if (sessionData) {
      setAuth(sessionData.user, sessionData.session);
    } else {
      // Fallback: use the user from the server response
      setAuth(serverUser as User | null, null);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Verify OTP</CardTitle>
        <CardDescription className="text-center">
          Enter the code sent to{' '}
          <span className="font-semibold text-foreground">
            {countryCode}
            {phoneNumber}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex flex-col items-center space-y-4"
        >
          {/* OTP Input */}
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
                    onChange={field.handleChange}
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

          {/* Submit */}
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                size="lg"
                disabled={!canSubmit || isPending || isSubmitting}
                className={GRADIENT_BUTTON}
              >
                {isSubmitting || isPending ? <Spinner /> : 'Verify Code'}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>

      {/* Back to phone step */}
      <CardFooter className="justify-center">
        <Button
          variant="link"
          onClick={() => setStep(1)}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Wrong number? Go back
        </Button>
      </CardFooter>
    </Card>
  );
}

export default OTPStep;
