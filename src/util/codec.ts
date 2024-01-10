import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";

export type Codec = {
  encode: (value: string) => string;
  decode: (value: string) => string;
};

export const none: Codec = {
  encode: (value: string) => value,
  decode: (value: string) => value
};

export const uri: Codec = {
  encode: (value: string) => encodeURIComponent(value),
  decode: (value: string) => decodeURIComponent(value)
};

export const base64: Codec = {
  encode: (value: string) => btoa(value),
  decode: (value: string) => atob(value)
};

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

// Throwback to the good old Osana days
export const whatTheFuck: Codec = {
  decode: (value: string): string => {
    const charShiftLength = parseInt(value.substring(0, 2));
    const charShiftData = parseInt(value.substring(2, charShiftLength + 2));

    const str = decodeURIComponent(
      value.substring(charShiftLength + 2, value.length)
    );
    const sections = str.match(new RegExp(`.{1,${charShiftLength}}`, "g"));

    let out = "";
    for (let i in sections) {
      for (let j in sections[i as any].split("")) {
        out += String.fromCharCode(
          sections[i as any][j].charCodeAt(0) -
            parseInt(charShiftData.toString()[j])
        );
      }
    }

    return decodeURIComponent(out);
  },
  encode: (value: string): string => {
    const charShiftLength = Math.ceil(Math.random() * 10);
    const charShiftData = ((n) => {
      let out = "";
      for (let i = 0; i < n; i++) out += Math.ceil(Math.random() * 9);
      return parseInt(out);
    })(charShiftLength);

    const str = encodeURIComponent(value);
    const sections = str.match(new RegExp(`.{1,${charShiftLength}}`, "g"));

    let out = "";
    for (let i in sections) {
      for (let j in sections[i as any].split("")) {
        out += String.fromCharCode(
          sections[i as any][j].charCodeAt(0) +
            parseInt(charShiftData.toString()[j])
        );
      }
    }

    return encodeURIComponent(
      `${
        charShiftLength < 10 ? `0${charShiftLength}` : charShiftLength
      }${charShiftData}${out}`
    );
  }
};
