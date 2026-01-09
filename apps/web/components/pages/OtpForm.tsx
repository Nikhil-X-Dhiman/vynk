'use client';
import { formOptions, useForm } from '@tanstack/react-form';
import { startTransition, useActionState } from 'react';
import { Field, FieldGroup } from '../ui/field';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '../ui/input-otp';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Button } from '../ui/button';
import { verifyOTPAction } from '@/app/actions/auth-actions';
import { useLoginStore } from '@/store';

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
  const phoneNumber = useLoginStore((state) => state.phoneNumber);
  const phonePrefix = useLoginStore((state) => state.phonePrefix);
  const [state, formAction, isPending] = useActionState(verifyOTPAction, {
    success: false,
    message: '',
  });
  const form = useForm({
    ...formOpts,
    validators: {
      onSubmit: ({ value }) => {
        console.log('Form Validation upon OTP Submission', value.otp);
      },
    },
    onSubmit: async ({ value }) => {
      console.log('Form Upon OTP Submission', value.otp);
      // formAction(value);
      const fd = new FormData();
      fd.append('otp', value.otp);
      fd.append('phonePrefix', phonePrefix);
      fd.append('phoneNumber', phoneNumber);
      console.log('transition starting');
      startTransition(() => {
        formAction(fd);
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
        <form.Subscribe selector={(state) => [state.canSubmit]}>
          {([canSubmit]) => (
            <Button
              type="submit"
              className="w-full mt-4"
              variant={'outline'}
              disabled={!canSubmit || isPending}
            >
              Verify OTP
            </Button>
          )}
        </form.Subscribe>
      </form>
      {/*! Delete this code line */}
      {isPending && 'Submitting using useActionState...'}
      {/* Del it too */}
      {state && (
        <p>
          {state.success} .. {state.message}
        </p>
      )}
      <Button variant={'destructive'}>Wrong Number? Go Back</Button>
    </>
  );
}

export default OTPForm;
