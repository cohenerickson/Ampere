import { AmpereWorker } from "../worker";

export type Plugin = {
  name: string;
  version: string;
  description: string;
  client?: (window: Window & typeof globalThis) => void;
  worker?: (worker: AmpereWorker) => void;
};
