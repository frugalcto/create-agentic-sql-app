export declare function waitForPort(port: number, host?: string, options?: {
    attempts?: number;
    delayMs?: number;
}): Promise<void>;
