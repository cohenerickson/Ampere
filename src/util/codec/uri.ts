import { Codec } from ".";

export const uri: Codec = {
  encode: (value: string) => encodeURIComponent(value),
  decode: (value: string) => decodeURIComponent(value)
};
