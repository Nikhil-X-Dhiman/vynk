'use client';
import { Dispatch, SetStateAction } from 'react';
import { loginSchema } from '@repo/shared';
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
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/ui/button';
// import { countries } from '@/utils/countries-list';
import countries from './../lib/data/countries.json' assert { type: 'json' };
import { Check, ChevronsUpDown, X } from 'lucide-react';
import Image from 'next/image';
import { useVirtualizer } from '@tanstack/react-virtual';
import { sendOTPAction } from '@/app/actions/auth-actions';

// import loginActions from '@/app/login/login.actions';

interface Login {
  countryCode: string;
  phone: string;
}

interface PrevState {
  success: boolean;
  message: string;
}

interface LoginFormProps {
  setPhoneNumber: Dispatch<SetStateAction<string>>;
}

const defaultValues: Login = {
  countryCode: '',
  phone: '',
};

export const formOpts = formOptions({
  defaultValues,
});

function LoginForm({ setPhoneNumber }: LoginFormProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const parentRef = useRef(null);
  const [state, formAction, isPending] = useActionState<PrevState, FormData>(
    sendOTPAction,
    {
      success: false,
      message: '',
    },
  );

  const filtered = useMemo(
    () =>
      countries.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // item height
    overscan: 30, // render a few extra items above/below viewport
  });

  const form = useForm({
    ...formOpts,
    validators: {
      onSubmit: ({ value }) => {
        // alert(`Form Validator Value: ${value.email}`);
        console.log(`onSubmit Validation: ${value.countryCode}${value.phone}`);
      },
    },
    onSubmit: async ({ value }) => {
      // alert(`Form Submitted Value: ${value.phone}`);
      // alert(`Form Submitted Value: ${value.countryCode}`);
      console.log('Validated TanStack Form values', value);
      const fd = new FormData();
      fd.append('countryCode', value.countryCode);
      fd.append('phone', value.phone);
      console.log('transition starting');
      startTransition(() => {
        setPhoneNumber(`${value.countryCode}${value.phone}`);
        formAction(fd);
      });
      // const result = await formAction(value);
      // console.log('Server Action Result: ', result);
      // formAction(value);
    },
  });

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        rowVirtualizer.measure();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, rowVirtualizer]);

  return (
    <>
      <form
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        // action={formAction}
      >
        <input
          type="hidden"
          name="countryCode"
          value={form.state.values.countryCode}
        />
        <FieldGroup>
          <form.Field name="countryCode">
            {(field) => {
              return (
                <Field>
                  <input
                    type="hidden"
                    name="countryCode"
                    value={field.state.value}
                  />
                  <Popover open={open} onOpenChange={setOpen}>
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
                                            ).src = '/flags/default.svg';
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
            }}
          </form.Field>
          <form.Field
            name="phone"
            validators={{
              onBlur: ({ value }) => {
                const { success, error } =
                  loginSchema.shape.phone.safeParse(value);
                if (!success) {
                  console.log(error.issues[0]);

                  return error.issues[0].message;
                }
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
                    name="phone"
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

          {/* <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                // const { success, error } = emailSchema.safeParse(value);
                const { success, error } =
                  loginSchema.shape.email.safeParse(value);
                if (!success) {
                  console.log(error.issues[0]);
                  return error.issues[0].message;
                }
              },
            }}
          >
            {(field) => {
              return (
                <>
                  <input
                    type="hidden"
                    name="email"
                    value={form.state.values.email}
                  />
                  <Input
                    type="email"
                    name="email"
                    placeholder="Email (optional)"
                    value={field.state.value}
                    // onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {!field.state.meta.isValid && (
                    <em role="alert">{field.state.meta.errors.join(', ')}</em>
                  )}
                </>
              );
            }}
          </form.Field> */}
        </FieldGroup>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isPending}
              variant={'outline'}
              size={'lg'}
              aria-label="send-otp"
              // onClick={(e) => {
              //   const valid = form.handleSubmit();
              //   if (!valid) {
              //     e.preventDefault(); // block browser submit only on INVALID
              //   }
              // }}
            >
              {isSubmitting ? '...' : 'Send OTP'}
            </Button>
          )}
        </form.Subscribe>
        {/*! Delete this code line */}
        {isPending && 'Submitting using useActionState...'}
        {/* Del it too */}
        {state && (
          <p>
            {state.success} .. {state.message}
          </p>
        )}
      </form>
    </>
  );
}

export default LoginForm;
