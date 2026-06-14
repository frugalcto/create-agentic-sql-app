export interface InteractiveStream {
    isTTY?: boolean;
}
export declare function isInteractive(stream?: InteractiveStream): boolean;
