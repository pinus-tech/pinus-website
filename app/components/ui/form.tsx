import React from "react";
import { cn } from "../lib/utils";

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <form
        className={cn("space-y-6", className)}
        ref={ref}
        {...props}
      >
        {children}
      </form>
    );
  }
);

Form.displayName = "Form";

export { Form }; 