"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

type FormSubmitButtonProps = React.ComponentProps<typeof Button> & {
  loadingText?: string;
};

export function FormSubmitButton({
  children,
  loadingText,
  disabled,
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      loading={pending}
      disabled={disabled || pending}
      {...props}
    >
      {pending && loadingText ? loadingText : children}
    </Button>
  );
}
