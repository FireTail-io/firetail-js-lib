import { FTResponse } from "../";
export declare const BYTES_PER_UTF16 = 4;
export declare const MIN_MAX_SIZE = 100000;
export declare const MIN_MAX_ITEMS = 100;
export declare const MIN_MAX_TIME_MS = 1000;
export default function logResponse(res: FTResponse): void;
export declare const _flushLogBuffer: () => void;
export declare function _logConfig(key: any, value: any): void;
