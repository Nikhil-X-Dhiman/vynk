/**
 * @fileoverview Phone Number Entry Step
 *
 * First step of the authentication flow. Collects the user's country
 * and phone number, validates the input against `libphonenumber-js` via
 * the shared `@repo/validation` schema, then calls the `sendOTPAction`
 * server action.
 *
 * On success, persists the phone number and country code to the login
 * store and transitions to step 2 (OTP verification).
 *
 * @module components/auth/PhoneNumberStep
 */

'use client';

import { useTransition } from 'react';
import { useForm } from '@tanstack/react-form';
import { toast } from 'sonner';

import countries from '@/lib/data/countries.json';
import { loginSchema } from '@repo/validation';
import { useLoginStore } from '@/store';
import { sendOTPAction } from '@/app/actions/login-auth';

import { FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent } from '@/components/ui/card';
import { CountrySelect } from '@/components/login/CountrySelect';

// ==========================================
// Constants
// ==========================================

/** Shared gradient button classes used across all auth steps. */
const GRADIENT_BUTTON =
  'w-full bg-linear-to-r from-indigo-500/90 via-sky-500/90 to-teal-500/90 hover:from-indigo-600 hover:via-sky-600 hover:to-teal-600 text-white border-0 transition-all duration-500 shadow-md hover:shadow-lg active:scale-[0.98]';

/** Label classes used across form fields. */
const FIELD_LABEL =
  'ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80';

// ==========================================
// Helpers
// ==========================================

/**
 * Maps a stored phone code (e.g. "+91") back to its ISO country code (e.g. "IN").
 * Returns an empty string if no match is found.
 */
function phoneCodeToISO(phoneCode: string): string {
  if (!phoneCode) return '';
  const digits = phoneCode.replace('+', '');
  const country = countries.find((c) => String(c.phone) === digits);
  return country?.code ?? '';
}

/**
 * Looks up a country's phone code from its ISO code.
 * Returns `null` if the country is not found.
 */
function lookupCountryByISO(isoCode: string) {
  return countries.find((c) => c.code === isoCode) ?? null;
}

// ==========================================
// Component
// ==========================================

/**
 * Phone number entry form.
 *
 * Renders a country selector and phone number input with real-time
 * validation. On submission the `sendOTPAction` server action is
 * invoked, and on success the login store is updated.
 */
function PhoneNumberStep() {
  const [isPending, startTransition] = useTransition();

  const prevPhoneNumber = useLoginStore((s) => s.phoneNumber);
  const prevCountryCode = useLoginStore((s) => s.countryCode);
  const setPhoneNumber = useLoginStore((s) => s.setPhoneNumber);
  const setCountryCode = useLoginStore((s) => s.setCountryCode);
  const setStep = useLoginStore((s) => s.setStep);

  const form = useForm({
    defaultValues: {
      countryCode: prevCountryCode ? phoneCodeToISO(prevCountryCode) : '',
      phoneNumber: prevPhoneNumber || '',
    },
    onSubmit: async ({ value }) => {
      // Offline guard
      if (!navigator.onLine) {
        toast.error('Offline', {
          description: 'Please check your internet connection and try again.',
        });
        return;
      }

      try {
        const country = lookupCountryByISO(value.countryCode);
        if (!country) {
          toast.error('Please select a valid country');
          return;
        }

        const phoneCode = country.phone;

        const fd = new FormData();
        fd.append('countryCode', phoneCode.toString());
        fd.append('phoneNumber', value.phoneNumber);

        const result = await sendOTPAction(fd);

        if (!result.success) {
          toast.error('Verification failed', {
            description: result.message || 'Check your number and try again.',
          });
          return;
        }

        // Update store and advance step only after success
        startTransition(() => {
          setPhoneNumber(value.phoneNumber);
          setCountryCode(`+${phoneCode}`);
          setStep(2);
        });
      } catch (err) {
        console.error('[PhoneNumberStep] Submission error:', err);
        toast.error('Connection Error', {
          description:
            'Unable to reach server. Please check your internet connection.',
        });
      }
    },
  });

  return (
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardContent className="space-y-6 pt-2">
        {/* Header */}
        <div className="space-y-1 text-center">
          <h2 className="text-md font-bold tracking-tight">
            Enter your phone number
          </h2>
          <p className="text-sm font-medium text-muted-foreground">
            Vynk will send an SMS message to verify your identity.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-5"
        >
          <FieldGroup className="gap-4">
            {/* Country Select */}
            <form.Field
              name="countryCode"
              validators={{
                onChange: ({ value }) =>
                  !value ? 'Country is required' : undefined,
                onSubmit: ({ value }) =>
                  !value ? 'Country is required' : undefined,
              }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <Label className={FIELD_LABEL}>Country / Region</Label>
                  <CountrySelect
                    value={field.state.value}
                    onChange={field.handleChange}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="ml-1 text-xs font-medium text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Phone Number Input */}
            <form.Field
              name="phoneNumber"
              validators={{
                onChange: ({ value }) =>
                  !value ? 'Phone number is required' : undefined,
                onSubmit: ({ value, fieldApi }) => {
                  const isoCode = fieldApi.form.getFieldValue('countryCode');
                  if (!isoCode) return undefined;

                  const country = lookupCountryByISO(isoCode);
                  if (!country) return 'Invalid country selected';

                  const fullNumber = `+${country.phone}${value}`;
                  const result =
                    loginSchema.shape.phoneNumber.safeParse(fullNumber);

                  return result.success
                    ? undefined
                    : result.error.issues[0]?.message;
                },
              }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <Label className={FIELD_LABEL}>Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="shadow-sm transition-all duration-300 focus-visible:border-indigo-500/50 focus-visible:ring-indigo-500/30"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="ml-1 text-xs font-medium text-destructive">
                      {field.state.meta.errors[0]}
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
                className={`mt-2 cursor-pointer ${GRADIENT_BUTTON}`}
              >
                {isSubmitting || isPending ? <Spinner /> : 'Send OTP'}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}

export default PhoneNumberStep;
