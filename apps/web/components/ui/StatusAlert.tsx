import * as React from 'react';
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  InfoIcon,
  AlertTriangleIcon,
  LucideIcon,
} from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils/tailwind-helpers';
import { Alert, AlertDescription, AlertTitle } from './alert';

// 1. Define distinct visual styles for each variant
// This extends the base Shadcn Alert styles to include Success and Warning
const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
        success:
          'border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-600 dark:text-green-400',
        warning:
          'border-yellow-500/50 text-yellow-700 dark:border-yellow-500 [&>svg]:text-yellow-600 dark:text-yellow-400',
        info: 'border-blue-500/50 text-blue-700 dark:border-blue-500 [&>svg]:text-blue-600 dark:text-blue-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// 2. Map variants to default icons
const ICON_MAP: Record<string, LucideIcon> = {
  default: InfoIcon,
  destructive: AlertCircleIcon,
  success: CheckCircle2Icon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
};

interface StatusAlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  icon?: LucideIcon;
  description?: React.ReactNode; // ReactNode allows strings, JSX, or lists
}

function StatusAlert({
  className,
  variant = 'default',
  title,
  description,
  icon: IconOverride,
  children,
  ...props
}: StatusAlertProps) {
  // Select the icon: User override > Variant default > Fallback
  const Icon = IconOverride || ICON_MAP[variant || 'default'] || InfoIcon;

  return (
    <Alert
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="h-4 w-4" />
      {title && <AlertTitle>{title}</AlertTitle>}
      {/* Render description prop OR children, but wrap text in AlertDescription for spacing */}
      {(description || children) && (
        <AlertDescription>
          {description}
          {children}
        </AlertDescription>
      )}
    </Alert>
  );
}

export { StatusAlert };
