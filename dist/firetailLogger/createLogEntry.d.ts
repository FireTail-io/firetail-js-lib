import { FTResponse } from "../";
export declare const VERSION = "1.0.0-alpha";
export declare const LOG_ACTION_BLOCKED = "blocked";
export declare const LOG_ACTION_MODIFIED = "modified";
export declare const LOG_ACTION_INFORMED = "informed";
export default function createLogEntry(res: FTResponse): string;
