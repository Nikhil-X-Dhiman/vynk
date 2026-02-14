'use client'

/**
 * @fileoverview OTP Verification Step
 * @module components/auth/OTPStep
 */

import { useTransition } from 'react'
import { useForm, formOptions } from '@tanstack/react-form'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import type { User } from 'better-auth'

import { otpSchema } from '@repo/validation'
import { useLoginStore } from '@/store'
import { useAuthStore } from '@/store/auth'
import { verifyOTPAction } from '@/app/actions/login-auth'
import { authClient } from '@/lib/auth/auth-client'

import { FieldGroup } from '@/components/ui/field'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const GRADIENT_BUTTON =
  'w-full bg-linear-to-r from-indigo-500/90 via-sky-500/90 to-teal-500/90 hover:from-indigo-600 hover:via-sky-600 hover:to-teal-600 text-white border-0 transition-all duration-500 shadow-md hover:shadow-lg active:scale-[0.98]'

const formOpts = formOptions({ defaultValues: { otp: '' } })

export default function OTPStep() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const phoneNumber = useLoginStore((s) => s.phoneNumber)
  const countryCode = useLoginStore((s) => s.countryCode)
  const setStep = useLoginStore((s) => s.setStep)
  const setAuth = useAuthStore((s) => s.setAuth)

  const form = useForm({
    ...formOpts,
    validators: {
      onSubmit: ({ value }) => {
        const result = otpSchema.safeParse(value.otp)
        return result.success ? undefined : result.error.issues[0]?.message
      },
    },
    onSubmit: async ({ value }) => {
      // 1. Offline Check
      if (!navigator.onLine) {
        toast.error('You are offline', {
          description: 'Please check your internet connection.',
        })
        return
      }

      startTransition(async () => {
        try {
          const fd = new FormData()
          fd.append('phoneNumber', phoneNumber)
          fd.append('countryCode', countryCode)
          fd.append('otp', value.otp)

          const response = await verifyOTPAction(fd)

          if (!response.success) {
            toast.error('Verification Failed', {
              description:
                response.message || 'Please check your code and try again.',
            })
            return
          }

          // Sync auth state
          await syncAuthState(response.user)

          if (response.isNewUser) {
            setStep(3)
          } else {
            toast.success('Welcome Back')
            router.push('/chats')
          }
        } catch (error) {
          console.error('[OTPStep] Error:', error)
          toast.error('Something went wrong', {
            description: 'Please try again.',
          })
        }
      })
    },
  })

  async function syncAuthState(serverUser: unknown) {
    try {
      const { data: sessionData } = await authClient.getSession()
      if (sessionData) {
        setAuth(sessionData.user, sessionData.session)
      } else {
        setAuth(serverUser as User | null, null)
      }
    } catch {
      // Fallback if client sync fails
      setAuth(serverUser as User | null, null)
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
            e.preventDefault()
            form.handleSubmit()
          }}
          className="flex flex-col items-center space-y-4"
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

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting] as const}
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
  )
}
