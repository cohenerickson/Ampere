import { Codec } from ".";

export const base64: Codec = {
  encode: (value: string) => btoa(value),
  decode: (value: string) => atob(value)
};
