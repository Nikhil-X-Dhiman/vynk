'use client';
// TODO: 1. Display Error Message from the server action stored in useState: error
// import { Dispatch, SetStateAction } from 'react';
import { loginSchema } from '@repo/validation';
import { formOptions, useForm } from '@tanstack/react-form';
import { FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  // useActionState,
  useState,
  useTransition,
} from 'react';
import { Button } from '@/components/ui/button';
// import { countries } from '@/utils/countries-list';
import { sendOTPAction } from '@/app/actions/auth-actions';
import { useLoginStore } from '@/store';
import { Spinner } from '../ui/spinner';
import { StatusAlert } from '../ui/StatusAlert';
import { toast } from 'sonner';
import { CountrySelect } from '../login/CountrySelect';
import { authClient } from '@/lib/auth/auth-client';

// import loginActions from '@/app/login/login.actions';

interface Login {
  countryCode: string;
  phoneNumber: string;
}

interface PrevState {
  success: boolean;
  message: string;
}

const defaultValues: Login = {
  countryCode: '',
  phoneNumber: '',
};

export const formOpts = formOptions({
  defaultValues,
});

function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const setPhoneNumber = useLoginStore((state) => state.setPhoneNumber);
  const setCountryCode = useLoginStore((state) => state.setCountryCode);
  const setStep = useLoginStore((state) => state.setStep);
  const [error, setError] = useState('');
  // const [state, formAction, isPending] = useActionState<PrevState, FormData>(
  //   sendOTPAction,
  //   {
  //     success: false,
  //     message: '',
  //   }
  // );

  const form = useForm({
    ...formOpts,
    validators: {
      onSubmit: ({ value }) => {
        if (!value) return 'Country Code Not Selected';
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      // const fd = new FormData();
      // fd.append('countryCode', String(value.countryCode));
      // fd.append('phoneNumber', value.phoneNumber);
      // startTransition(async () => {
      //   await formAction(fd);
      //   if (state.success) {
      //     setPhoneNumber(value.phoneNumber);
      //     setCountryCode(String(value.countryCode));
      //     setStep(2);
      //   } else {
      //     setError(state.message);
      //     toast.error('Unable to send OTP', {
      //       description: `${error}`,
      //     });
      //   }
      // });
      startTransition(async () => {
        const fullPhoneNumber = `${value.countryCode}${value.phoneNumber}`;
        const result = await authClient.phoneNumber.sendOtp({
          phoneNumber: fullPhoneNumber,
        });
        if (!result.error) {
          setPhoneNumber(value.phoneNumber);
          setCountryCode(String(value.countryCode));
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
    <>
      {error && (
        <StatusAlert
          variant="destructive"
          title="Unable to Send OTP"
          description={error}
        />
      )}
      <form
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <input
          type="hidden"
          name="countryCode"
          value={form.state.values.countryCode}
        />
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
              onChange: ({ value, fieldApi }) => {
                // Access the value of country code
                const countryCode = fieldApi.form.getFieldValue('countryCode');
                if (!countryCode) return undefined;

                const fullNumber = `+${countryCode}${value}`;
                console.log('full', fullNumber);

                const { success, error } =
                  loginSchema.shape.phoneNumber.safeParse(fullNumber);
                if (!success) return error.issues[0].message;
                return undefined;
              },
            }}
          >
            {(field) => {
              return (
                <>
                  <Input
                    type="tel"
                    name={field.name}
                    placeholder="Phone Number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {!field.state.meta.isValid && (
                    <em role="alert">{field.state.meta.errors.join(', ')}</em>
                  )}
                </>
              );
            }}
          </form.Field>
          <div className="flex items-center gap-4">
            <hr className="flex-1 bg-gray-300" />
            <span className="px-2 text-gray-600">or</span>
            <hr className="flex-1 bg-gray-300" />
          </div>
        </FieldGroup>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isPending || isSubmitting}
              variant={'outline'}
              size={'lg'}
              aria-label="send-otp"
            >
              {isSubmitting ? <Spinner /> : 'Send OTP'}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </>
  );
}

export default LoginForm;
