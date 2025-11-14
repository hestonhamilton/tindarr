import React from "react";

import styles from "./TextInput.module.css";

interface TextInputProps {
  name: string;
  value?: string;
  paddingTop?: "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "s7";
  autoComplete?: string;
  invalid?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  testHandle?: string;
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
}

export const TextInput = ({
  value,
  name,
  autoComplete,
  invalid,
  onChange,
  onBlur,
  paddingTop,
  testHandle,
  type,
  inputMode,
  placeholder,
}: TextInputProps) => (
  <input
    className={`${styles.textInput} ${invalid ? styles.invalid : ""}`}
    style={{
      ...(paddingTop ? { marginTop: `var(--${paddingTop})` } : {}),
    }}
    type={type ?? "text"}
    inputMode={inputMode}
    name={name}
    id={`${name}-text-input`}
    value={value}
    autoComplete={autoComplete ?? "off"}
    autoCorrect="off"
    onChange={onChange}
    onBlur={onBlur}
    placeholder={placeholder}
    data-test-handle={testHandle ?? `${name}-text-input`}
  />
);
