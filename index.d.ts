/// <reference types="node" />
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
declare const ThreadPool_base: typeof import("events").EventEmitter;
export class ThreadPool extends ThreadPool_base {
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
     * @param {...any} args - Arguments passed to the configured task.
     * @returns {Promise<any>}
     */
    run(...args: any[]): Promise<any>;
    /**
     * Queue several functions
     *
     * @param {function} fn - Function to queue
     * @returns {Promise<any>}
     */
    queue(fn: Function): Promise<any>;
    /**
     * Wait until the queue is empty
     * @returns {Promise<any>}
     */
    wait(): Promise<any>;
    /**
     * Wait until the queue is empty, then terminate all listeners
     * @returns {Promise<any>}
     */
    close(): Promise<any>;
    #private;
}
export {};
