import { ToggleTheme } from '@/components/ToggleTheme';
import { formOptions } from '@tanstack/react-form';
// import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  // SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SelectCountryVirtualizer from '@/components/ui/SelectCountryVirtualizer';
// import metadata from 'libphonenumber-js/metadata.full';

interface Login {
  email: string;
  phone: string;
}

const defaultValues: Login = {
  email: '',
  phone: '',
};

export const formOpts = formOptions({
  defaultValues,
});

export default function Login() {
  // const countries = Object.entries(metadata.countries).map(([code, data]) => ({
  //   iso: code,
  //   dialCode: `+${data[0]}`,
  //   flag: String.fromCodePoint(
  //     ...code
  //       .toUpperCase()
  //       .split('')
  //       .map((char) => 127397 + char.charCodeAt(0)),
  //   ),
  // }));

  return (
    <>
      Login <ToggleTheme />
      <Card>
        <CardHeader>
          {/* <Image src="" alt="Brand-Img" width={200} height={100} /> */}
          <CardTitle>VYNK Login</CardTitle>
          <CardDescription>
            Enter your phone number to receive an OTP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="+1" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Country Code</SelectLabel>
                  <SelectCountryVirtualizer />
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input type="tel" placeholder="Phone Number" />
          </div>
          <div className="flex items-center gap-4">
            {/* <div className="flex-1 h-px bg-gray-300"></div> */}
            <hr className="flex-1 bg-gray-300" />
            <span className="px-2 text-gray-600">or</span>
            <hr className="flex-1 bg-gray-300" />
          </div>
          <Input type="email" placeholder="Email (optional)" />
          <Button variant={'outline'} size={'lg'} aria-label="send-otp">
            Send OTP
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
