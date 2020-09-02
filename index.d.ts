export type ThreadPoolArgs = {
    /**
     * - Function to run in each thread.
     */
    task: Function;
    /**
     * - Number of threads
     */
    size?: number;
};
declare const ThreadPool_base: any;
export class ThreadPool extends ThreadPool_base {
    [x: string]: any;
    /**
     * Create a thread pool that runs a specific function
     *
     * @param {ThreadPoolArgs}
     */
    constructor({ task, size }: ThreadPoolArgs);
    /**
     * Determines if you're currently running in the main or thread context
     * @type {boolean}
     * */
    isMainThread: boolean;
    /**
     * Create a thread pool that runs a specific function
     *
     * @param {...object} args - Arguments passed to the configured task.
     * @returns {Promise<any>}
     */
    run(...args: object[]): Promise<any>;
    queue(fn: any): void;
    onIdle(): Promise<void>;
    close(): Promise<void>;
    all(args: any): Promise<any[]>;
    #private;
}
export {};
