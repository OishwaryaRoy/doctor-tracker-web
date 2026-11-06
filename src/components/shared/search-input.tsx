"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  delay = 300,
  className,
  label = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
  label?: string;
}) {
  const [text, setText] = useState(value);
  const lastReported = useRef(value);

  useEffect(() => {
    if (value !== lastReported.current) {
      lastReported.current = value;
      setText(value);
    }
  }, [value]);

  useEffect(() => {
    if (text === lastReported.current) return;
    const timer = setTimeout(() => {
      lastReported.current = text;
      onChange(text);
    }, delay);
    return () => clearTimeout(timer);
  }, [text, delay, onChange]);

  return (
    <InputGroup className={cn("bg-card", className)}>
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && text) {
            event.preventDefault();
            setText("");
          }
        }}
        className="[&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => setText("")}>
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
