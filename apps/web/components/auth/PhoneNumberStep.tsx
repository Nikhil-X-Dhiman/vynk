'use client';

import { loginSchema } from '@repo/validation';
import { formOptions, useForm } from '@tanstack/react-form';
import { FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useLoginStore } from '@/store';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { CountrySelect } from '@/components/login/CountrySelect';
import { authClient } from '@/lib/auth/auth-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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
    validators: {
      onSubmit: ({ value }) => {
        if (!value.countryCode) return 'Country Code Not Selected';
        if (!value.phoneNumber) return 'Phone Number Required';
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      startTransition(async () => {
        const fullPhoneNumber = `+${value.countryCode}${value.phoneNumber}`;
        const result = await authClient.phoneNumber.sendOtp({
          phoneNumber: fullPhoneNumber,
        });
        if (!result.error) {
          setPhoneNumber(value.phoneNumber);
          setCountryCode(`+${String(value.countryCode)}`);
          setStep(2);
        } else {
          toast.error('Unable to send OTP', {
            description: `${result.error.message}`,
          });
        }
      });
    },
  });

  return (
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardContent>
        <form
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <FieldGroup>
            <form.Field name="countryCode">
              {(field) => (
                <CountrySelect
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              )}
            </form.Field>
            <form.Field
              name="phoneNumber"
              validators={{
                onChangeListenTo: ['countryCode'],
                onSubmit: ({ value, fieldApi }) => {
                  const countryCode = fieldApi.form.getFieldValue('countryCode');
                  if (!countryCode) return undefined;

                  const fullNumber = `+${countryCode}${value}`;
                  const { success, error } =
                    loginSchema.shape.phoneNumber.safeParse(fullNumber);
                  if (!success) return error.issues[0].message;
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-1">
                  <Input
                    type="tel"
                    name={field.name}
                    placeholder="Phone Number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {!field.state.meta.isValid && (
                    <p className="text-sm text-destructive">
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
