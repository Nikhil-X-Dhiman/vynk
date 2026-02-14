'use client'

/**
 * @fileoverview Phone Number Entry Step
 * @module components/auth/PhoneNumberStep
 */

import { useTransition } from 'react'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'

import countries from '@/lib/data/countries.json'
import { loginSchema } from '@repo/validation'
import { useLoginStore } from '@/store'
import { sendOTPAction } from '@/app/actions/login-auth'

import { FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent } from '@/components/ui/card'
import { CountrySelect } from '@/components/login/CountrySelect'

const GRADIENT_BUTTON =
  'w-full bg-linear-to-r from-indigo-500/90 via-sky-500/90 to-teal-500/90 hover:from-indigo-600 hover:via-sky-600 hover:to-teal-600 text-white border-0 transition-all duration-500 shadow-md hover:shadow-lg active:scale-[0.98]'

const FIELD_LABEL =
  'ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80'

function phoneCodeToISO(phoneCode: string): string {
  if (!phoneCode) return ''
  const digits = phoneCode.replace('+', '')
  const country = countries.find((c) => String(c.phone) === digits)
  return country?.code ?? ''
}

function lookupCountryByISO(isoCode: string) {
  return countries.find((c) => c.code === isoCode) ?? null
}

export default function PhoneNumberStep() {
  const [isPending, startTransition] = useTransition()

  const prevPhoneNumber = useLoginStore((s) => s.phoneNumber)
  const prevCountryCode = useLoginStore((s) => s.countryCode)
  const setPhoneNumber = useLoginStore((s) => s.setPhoneNumber)
  const setCountryCode = useLoginStore((s) => s.setCountryCode)
  const setStep = useLoginStore((s) => s.setStep)

  const form = useForm({
    defaultValues: {
      countryCode: prevCountryCode ? phoneCodeToISO(prevCountryCode) : '',
      phoneNumber: prevPhoneNumber || '',
    },
    onSubmit: async ({ value }) => {
      // 1. Offline Check
      if (!navigator.onLine) {
        toast.error('You are offline', {
          description: 'Please check your internet connection.',
        })
        return
      }

      try {
        const country = lookupCountryByISO(value.countryCode)
        if (!country) {
          toast.error('Please select a valid country')
          return
        }

        const phoneCode = country.phone

        const fd = new FormData()
        fd.append('countryCode', phoneCode.toString())
        fd.append('phoneNumber', value.phoneNumber)

        const result = await sendOTPAction(fd)

        if (!result.success) {
          toast.error('Verification failed', {
            description: result.message || 'Check your number and try again.',
          })
          return
        }

        startTransition(() => {
          setPhoneNumber(value.phoneNumber)
          setCountryCode(`+${phoneCode}`)
          setStep(2)
        })
      } catch (err) {
        console.error('[PhoneNumberStep] Error:', err)
        toast.error('Connection Error', {
          description: 'Unable to reach the server.',
        })
      }
    },
  })

  return (
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardContent className="space-y-6 pt-2">
        <div className="space-y-1 text-center">
          <h2 className="text-md font-bold tracking-tight">
            Enter your phone number
          </h2>
          <p className="text-sm font-medium text-muted-foreground">
            We will send an SMS to verify your identity.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-5"
        >
          <FieldGroup className="gap-4">
            {/* Country Selector */}
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

            {/* Phone Input */}
            <form.Field
              name="phoneNumber"
              validators={{
                onChange: ({ value }) =>
                  !value ? 'Phone number is required' : undefined,
                onSubmit: ({ value, fieldApi }) => {
                  const isoCode = fieldApi.form.getFieldValue('countryCode')
                  if (!isoCode) return undefined

                  const country = lookupCountryByISO(isoCode)
                  if (!country) return 'Invalid country selected'

                  const fullNumber = `+${country.phone}${value}`
                  const result =
                    loginSchema.shape.phoneNumber.safeParse(fullNumber)

                  return result.success
                    ? undefined
                    : result.error.issues[0]?.message
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

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting] as const}
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
  )
}
