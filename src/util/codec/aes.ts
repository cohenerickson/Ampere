import { Codec } from ".";
import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";

export const aes: Codec = {
  encode: (value: string) => {
    return encodeURIComponent(
      AES.encrypt(value, location.origin + navigator.userAgent)
        .toString()
        .substring(10)
    );
  },
  decode: (value: string) => {
    return AES.decrypt(
      "U2FsdGVkX1" + decodeURIComponent(value),
      location.origin + navigator.userAgent
    ).toString(Utf8);
  }
};
