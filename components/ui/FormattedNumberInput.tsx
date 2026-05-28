import * as React from "react"
import { Input } from "@/components/ui/input"

interface FormattedNumberInputProps extends Omit<React.ComponentProps<"input">, 'onChange'> {
  value: string | number
  onChange: (value: string) => void
}

export const FormattedNumberInput = React.forwardRef<HTMLInputElement, FormattedNumberInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    // Format the incoming value
    const formatValue = (val: string | number) => {
      if (val === undefined || val === null || val === '') return '';
      const stringValue = String(val).replace(/\D/g, ''); // Remove non-digits
      if (!stringValue) return '';
      // Group by thousands with spaces
      return stringValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, '');
      onChange(rawValue);
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={formatValue(value)}
        onChange={handleChange}
        className={className}
        {...props}
      />
    )
  }
)
FormattedNumberInput.displayName = "FormattedNumberInput"
