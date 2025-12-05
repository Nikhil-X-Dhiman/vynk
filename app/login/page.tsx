'use client';
// import { loginSchema } from '@/utils/schema/login-schema';
// import { formOptions, useForm } from '@tanstack/react-form';
// import { Field, FieldGroup } from '@/components/ui/field';
// import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import LoginForm from '@/components/LoginForm';
import OTPForm from '@/components/OTPForm';
import AvatarLogin from '@/components/AvatarLogin';
import { useState } from 'react';
// import {
//   Command,
//   CommandEmpty,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from '@/components/ui/command';
// import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { countries } from '@/utils/countries-list';
// import { Check, ChevronsUpDown, X } from 'lucide-react';
// import Image from 'next/image';
// import { useVirtualizer } from '@tanstack/react-virtual';
// import loginActions from './login.actions';

function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Vynk</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm setPhoneNumber={setPhoneNumber} />
          <OTPForm phoneNumber={phoneNumber} />
          <AvatarLogin />
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;
