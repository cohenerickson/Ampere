export type Codec = {
  encode: (value: string) => string;
  decode: (value: string) => string;
};
