import React from "react";
import { cn } from "../lib/utils";

export interface PhoneInputProps {
  label?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const PhoneInput = React.forwardRef<HTMLDivElement, PhoneInputProps>(
  (
    {
      className,
      label,
      error,
      value,
      onChange,
      required,
      placeholder,
      disabled,
      ...props
    },
    ref
  ) => {
    // Parse the current value to separate country code and number
    const getCountryCodeAndNumber = (phoneValue: string) => {
      if (phoneValue.startsWith("+62")) {
        return { countryCode: "+62", number: phoneValue.slice(3) };
      } else if (phoneValue.startsWith("+65")) {
        return { countryCode: "+65", number: phoneValue.slice(3) };
      } else {
        return { countryCode: "+65", number: phoneValue.replace(/^\+/, "") };
      }
    };

    const { countryCode, number } = getCountryCodeAndNumber(value);

    const handleCountryCodeChange = (newCountryCode: string) => {
      onChange(newCountryCode + number);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newNumber = e.target.value.replace(/[^\d]/g, ""); // Only allow digits
      onChange(countryCode + newNumber);
    };

    return (
      <div className="w-full flex flex-col gap-2" ref={ref} {...props}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="flex">
          {/* Country Code Dropdown */}
          <select
            value={countryCode}
            onChange={(e) => handleCountryCodeChange(e.target.value)}
            disabled={disabled}
            className={cn(
              "flex h-10 rounded-l-md border border-r-0 border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-blue-main focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-500 focus:ring-red-500"
            )}
          >
            <option value="+65">🇸🇬 +65</option>
            <option value="+62">🇮🇩 +62</option>
          </select>

          {/* Phone Number Input */}
          <input
            type="tel"
            value={number}
            onChange={handleNumberChange}
            placeholder={placeholder || "12345678"}
            disabled={disabled}
            className={cn(
              "flex h-10 flex-1 rounded-r-md rounded-l-none border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-main focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-500 focus:ring-red-500",
              className
            )}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
