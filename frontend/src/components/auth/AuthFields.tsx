"use client";

import { useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

import { AlertIcon, EyeIcon, EyeOffIcon } from "@/components/ui/icons";

const INPUT_BASE =
  "h-11 w-full rounded-lg border bg-white px-3.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-[#a79b8a] focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#c9b28e]/30 disabled:cursor-not-allowed disabled:bg-[#f4f1e8] disabled:text-muted";

function inputClass(error: string | undefined): string {
  return `${INPUT_BASE} ${error ? "border-red-400" : "border-[#c9b8a2]"}`;
}

function FieldLabel({
  htmlFor,
  label,
  hint,
}: {
  htmlFor: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <label
        htmlFor={htmlFor}
        className="text-[12px] font-medium text-[#3f3a30]"
      >
        {label}
      </label>
      {hint ? <span className="text-[10.5px] text-muted">{hint}</span> : null}
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p id={`${id}-error`} className="mt-1.5 text-[11.5px] text-red-700">
      {message}
    </p>
  );
}

interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className"> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
}

export function TextField({
  id,
  label,
  error,
  hint,
  ...props
}: TextFieldProps) {
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} hint={hint} />
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-1.5 ${inputClass(error)}`}
        {...props}
      />
      <FieldError id={id} message={error} />
    </div>
  );
}

interface PasswordFieldProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "id" | "className" | "type"
  > {
  id: string;
  label: string;
  error?: string;
  hint?: string;
}

export function PasswordField({
  id,
  label,
  error,
  hint,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <FieldLabel htmlFor={id} label={label} hint={hint} />
      <div className="relative mt-1.5">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputClass(error)} pr-11`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
          aria-pressed={visible}
          disabled={props.disabled}
          className="focus-ring absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-[#8a7f6e] transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {visible ? (
            <EyeOffIcon className="h-[18px] w-[18px]" />
          ) : (
            <EyeIcon className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>
      <FieldError id={id} message={error} />
    </div>
  );
}

export function AuthAlert({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] leading-[1.7] text-red-800"
    >
      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
