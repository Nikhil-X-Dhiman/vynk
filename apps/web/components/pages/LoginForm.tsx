'use client';
// TODO: 1. Display Error Message from the server action stored in useState: error
// import { Dispatch, SetStateAction } from 'react';
import { loginSchema } from '@repo/validation';
import { formOptions, useForm } from '@tanstack/react-form';
import { Field, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/ui/button';
// import { countries } from '@/utils/countries-list';
import countries from '@/lib/data/countries.json' assert { type: 'json' };
import { Check, ChevronsUpDown, X } from 'lucide-react';
import Image from 'next/image';
import { sendOTPAction } from '@/app/actions/auth-actions';
import { useLoginStore } from '@/store';
import { Spinner } from '../ui/spinner';
import { StatusAlert } from '../ui/StatusAlert';
import { toast } from 'sonner';
import { CountrySelect } from '../login/CountrySelect';

// import loginActions from '@/app/login/login.actions';

interface Login {
  countryCode: string;
  phoneNumber: string;
}

// enum Status {
//   ''
// }
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
  const setPhoneNumber = useLoginStore((state) => state.setPhoneNumber);
  const setCountryCode = useLoginStore((state) => state.setCountryCode);
  const setStep = useLoginStore((state) => state.setStep);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const parentRef = useRef(null);
  const [state, formAction, isPending] = useActionState<PrevState, FormData>(
    sendOTPAction,
    {
      success: false,
      message: '',
    }
  );

  const filtered = useMemo(
    () =>
      countries.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  const form = useForm({
    ...formOpts,
    validators: {
      onSubmit: ({ value }) => {
        if (!value) return 'Country Code Not Selected';
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      const fd = new FormData();
      fd.append('countryCode', value.countryCode);
      fd.append('phoneNumber', value.phoneNumber);
      startTransition(async () => {
        await formAction(fd);
        if (state.success) {
          setPhoneNumber(value.phoneNumber);
          setCountryCode(value.countryCode);
          setStep(2);
        } else {
          setError(state.message);
          toast.error('Unable to send OTP', {
            description: `${error}`,
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
            {(field)=>(
              <CountrySelect value={field.state.value} onChange={field.handleChange} />
            )}
            {/* {(field) => {
              return (
                <Field>

                  <Popover
                    open={open}
                    onOpenChange={setOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="justify-between"
                      >
                        {field.state.value && '+'}
                        {field.state.value || 'Select country'}
                        <ChevronsUpDown />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Select Code"
                          value={search}
                          onValueChange={setSearch}
                        />
                        <CommandList
                          ref={parentRef}
                          className="max-h-60 overflow-auto"
                          style={{
                            height: '300px',
                            overflow: 'auto',
                            transform: 'translateZ(0)',
                          }}
                        >
                          {filtered.length === 0 ? (
                            <CommandEmpty className="flex items-center justify-center gap-1">
                              <X color="#f00000" />
                              <span>No Country Found</span>
                            </CommandEmpty>
                          ) : (
                            <div
                              style={{
                                height: rowVirtualizer.getTotalSize(),
                                position: 'relative',
                              }}
                            >
                              {rowVirtualizer
                                .getVirtualItems()
                                .map((virtualItem) => {
                                  const country = filtered[virtualItem.index];
                                  return (
                                    <CommandItem
                                      key={country.code}
                                      value={String(country.name)}
                                      onSelect={() => {
                                        // setValue(phone === value ? '' : phone);
                                        field.handleChange(`${country.phone}`);

                                        setOpen(false);
                                      }}
                                      className="justify-between truncate flex-1"
                                      style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: virtualItem.size,
                                        transform: `translateY(${virtualItem.start}px)`,
                                      }}
                                    >
                                      <div className="flex justify-between w-full truncate gap-2 flex-1">
                                        <Image
                                          src={`https://cdn.jsdelivr.net/npm/circle-flags/flags/${country.code.toLowerCase()}.svg`}
                                          onError={(e) => {
                                            (
                                              e.currentTarget as HTMLImageElement
                                            ).src = '/assets/flags/default.svg';
                                          }}
                                          style={{ flexShrink: 0 }}
                                          width={20}
                                          height={20}
                                          alt={country.name}
                                          priority={false}
                                          // placeholder="blur"
                                          // blurDataURL=""
                                        />
                                        <span className="truncate flex-1">
                                          {country.name}
                                        </span>
                                        <span className="text-muted-foreground text-xs">
                                          +{country.phone}
                                        </span>
                                      </div>
                                      {filtered[virtualItem.index].phone ===
                                        Number(field.state.value) && <Check />}
                                      {/* <Check /> */}
                                    </CommandItem>
                                  );
                                })}
                            </div>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </Field>
              );
            }} */}
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
                  {/* <input
                    type="hidden"
                    name="phone"
                    value={form.state.values.phone}
                  /> */}
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
