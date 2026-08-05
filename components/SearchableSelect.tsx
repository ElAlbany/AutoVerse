"use client";

import { Fragment, useState } from "react";
import { Combobox, Transition } from "@headlessui/react";

interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
}

export default function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
}: SearchableSelectProps) {
  const [query, setQuery] = useState("");

  const filteredOptions =
    query === ""
      ? options
      : options.filter((opt) =>
          opt.label.toLowerCase().includes(query.toLowerCase()),
        );

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
        {label}
      </label>
      <Combobox value={value} onChange={(val) => onChange(val || "")}>
        <div className="relative">
          <Combobox.Input
            className="w-full rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-colors duration-500"
            displayValue={() => selectedOption?.label || ""}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-4 w-4 text-gray-400 dark:text-dark-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </Combobox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery("")}
          >
            <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-dark-card py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100 dark:border-dark-border transition-colors duration-500">
              {filteredOptions.length === 0 && query !== "" ? (
                <div className="relative cursor-default select-none px-4 py-2.5 text-gray-500 dark:text-dark-muted">
                  No results found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <Combobox.Option
                    key={option.value}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2.5 pl-10 pr-4 transition-colors ${
                        active
                          ? "bg-primary-blue text-white"
                          : "text-gray-900 dark:text-dark-text"
                      }`
                    }
                    value={option.value}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-semibold" : "font-normal"
                          }`}
                        >
                          {option.label}
                        </span>
                        {selected && (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? "text-white" : "text-primary-blue"
                            }`}
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </span>
                        )}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
}
