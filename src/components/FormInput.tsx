import React from "react";
import { useFormContext } from "react-hook-form";

type FormInputProps = {
  label: string;
  name: string;
  type?: string;
  value?: string;
  onchange?: string;
};

const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  type,
  value,
  onchange,
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  return (
    <div className="">
      <label htmlFor={name} className="mb-3 block text-ct-blue-600">
        {label}
      </label>
      <input
        type={type}
        placeholder=" "
        className="block w-full appearance-none rounded-2xl px-4 py-2 focus:outline-none"
        step="0.01"
        value={value}
        {...register(name)}
      />
      {errors[name] && (
        <span className="block pt-1 text-xs text-red-500">
          {errors[name]?.message as string}
        </span>
      )}
    </div>
  );
};

export default FormInput;
