'use client';

import countries from '@/lib/data/countries.json';
import { loginSchema } from '@repo/validation';
import { formOptions, useForm } from '@tanstack/react-form';
import { FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useLoginStore } from '@/store';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { CountrySelect } from '@/components/login/CountrySelect';
import { authClient } from '@/lib/auth/auth-client';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '../ui/label';

interface Login {
  countryCode: string;
  phoneNumber: string;
}

const defaultValues: Login = {
  countryCode: '',
  phoneNumber: '',
};

export const formOpts = formOptions({
  defaultValues,
});



function PhoneNumberStep() {
  const [isPending, startTransition] = useTransition();
  const setPhoneNumber = useLoginStore((state) => state.setPhoneNumber);
  const setCountryCode = useLoginStore((state) => state.setCountryCode);
  const setStep = useLoginStore((state) => state.setStep);

  const form = useForm({
    ...formOpts,
    onSubmit: async ({ value }) => {
      try {
        startTransition(async () => {
          const country = countries.find((c) => c.code === value.countryCode);
          if (!country) {
            toast.error('Please select a valid country');
            return;
          }

          const phoneCode = country.phone;
          const fullPhoneNumber = `+${phoneCode}${value.phoneNumber}`;

          const result = await authClient.phoneNumber.sendOtp({
            phoneNumber: fullPhoneNumber,
          });

          if (!result.error) {
            setPhoneNumber(value.phoneNumber);
            setCountryCode(`+${phoneCode}`);
            setStep(2);
          } else {
            toast.error('Verification failed', {
              description:
                result.error.message || 'Check your number and try again.',
            });
          }
        });
      } catch (err) {
        console.error('Submission error:', err);
        toast.error('Something went wrong. Please try again.');
      }
    },
  });

  return (
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardContent className="space-y-6 pt-2">
        <div className="space-y-1">
          <h2 className="text-md font-bold tracking-tight text-center">
            Enter your phone number
          </h2>
          <p className="text-sm text-muted-foreground font-medium text-center">
            Vynk will send an SMS message to verify your identity.
          </p>
        </div>

        <form
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent event bubbling that can cause refreshes
            form.handleSubmit();
          }}
          className="space-y-5"
        >
          <FieldGroup className="gap-4">
            {/* Country Selection Field */}
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
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
                    Country / Region
                  </Label>
                  <CountrySelect
                    value={field.state.value}
                    onChange={field.handleChange}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-[12px] font-medium text-destructive ml-1">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Phone Number Field */}
            <form.Field
              name="phoneNumber"
              validators={{
                onChange: ({ value }) =>
                  !value ? 'Phone number is required' : undefined,
                onSubmit: ({ value, fieldApi }) => {
                  const countryCodeISO =
                    fieldApi.form.getFieldValue('countryCode');
                  if (!countryCodeISO) return undefined;

                  const country = countries.find(
                    (c) => c.code === countryCodeISO,
                  );
                  if (!country) return 'Invalid Country Selected';
                  const phoneCode = country ? country.phone : '';
                  const fullNumber = `+${phoneCode}${value}`;

                  const { success, error } =
                    loginSchema.shape.phoneNumber.safeParse(fullNumber);
                  if (!success) return error.issues[0].message;
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
                    Phone Number
                  </Label>
                  <Input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50 transition-all duration-300 shadow-sm"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-[12px] font-medium text-destructive ml-1">
                      {field.state.meta.errors[0]}
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
                className="cursor-pointer w-full bg-linear-to-r from-indigo-500/90 via-sky-500/90 to-teal-500/90 hover:from-indigo-600 hover:via-sky-600 hover:to-teal-600 text-white border-0 transition-all duration-500 shadow-md hover:shadow-lg active:scale-[0.98] mt-2"
                size="lg"
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
