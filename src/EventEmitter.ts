/**
 * This is a partial (and more efficient) implementation of the event emitter.
 * It attempts to maintain a one-to-one mapping between events and listeners, skipping an array lookup.
 * Only if there are multiple listeners, they are combined in an array.
 */
export default class EventEmitter {
    private hasEventListeners: boolean;
    private eventFunction?: { [name: string]: Function } = {};
    private eventListeners?: { [name: string]: Function[] } = {};

    constructor() {
        // This is set (and kept) to true when events are used at all.
        this.hasEventListeners = false;
    }

    static construct(obj: EventEmitter) {
        obj.hasEventListeners = false;
    }

    on(name: string, listener: Function) {
        if (!this.hasEventListeners) {
            this.eventFunction = {};
            this.eventListeners = {};
            this.hasEventListeners = true;
        }

        const eventFunction = this.eventFunction!;
        const eventListeners = this.eventListeners!;

        const current = eventFunction[name];
        if (!current) {
            eventFunction[name] = listener;
        } else {
            if (eventFunction[name] !== EventEmitter.combiner) {
                eventListeners[name] = [eventFunction[name], listener];
                eventFunction[name] = EventEmitter.combiner;
            } else {
                eventListeners[name].push(listener);
            }
        }
    }

    has(name: string, listener: Function) {
        if (this.hasEventListeners) {
            const eventFunction = this.eventFunction!;
            const eventListeners = this.eventListeners!;

            const current = eventFunction[name];
            if (current) {
                if (current === EventEmitter.combiner) {
                    const listeners = eventListeners[name];
                    const index = listeners.indexOf(listener);
                    return index >= 0;
                } else if (eventFunction[name] === listener) {
                    return true;
                }
            }
        }
        return false;
    }

    off(name: string, listener: Function) {
        if (this.hasEventListeners) {
            const eventFunction = this.eventFunction!;
            const eventListeners = this.eventListeners!;

            const current = eventFunction[name];
            if (current) {
                if (current === EventEmitter.combiner) {
                    const listeners = eventListeners[name];
                    const index = listeners.indexOf(listener);
                    if (index >= 0) {
                        listeners.splice(index, 1);
                    }
                    if (listeners.length === 1) {
                        eventFunction[name] = listeners[0];
                        delete eventListeners[name];
                    }
                } else if (eventFunction[name] === listener) {
                    delete eventFunction[name];
                }
            }
        }
    }

    removeListener(name: string, listener: Function) {
        this.off(name, listener);
    }

    emit(name: string, arg1: any = undefined, arg2: any = undefined, arg3: any = undefined) {
        if (this.hasEventListeners) {
            const func = this.eventFunction![name];
            if (func) {
                if (func === EventEmitter.combiner) {
                    func(this, name, arg1, arg2, arg3);
                } else {
                    func(arg1, arg2, arg3);
                }
            }
        }
    }

    listenerCount(name: string) {
        if (this.hasEventListeners) {
            const func = this.eventFunction![name];
            if (func) {
                if (func === EventEmitter.combiner) {
                    return this.eventListeners![name].length;
                } else {
                    return 1;
                }
            }
        } else {
            return 0;
        }
    }

    removeAllListeners(name: string) {
        if (this.hasEventListeners) {
            delete this.eventFunction![name];
            delete this.eventListeners![name];
        }
    }

    private static combiner(object: EventEmitter, name: string, arg1: any, arg2: any, arg3: any) {
        const listeners = object.eventListeners![name];
        if (listeners) {
            // Because listener may detach itself while being invoked, we use a forEach instead of for loop.
            listeners.forEach(listener => {
                listener(arg1, arg2, arg3);
            });
        }
    }

    public static mixin(base: new (...args: any) => any) {
        base.prototype.on = EventEmitter.prototype.on;
        base.prototype.has = EventEmitter.prototype.has;
        base.prototype.off = EventEmitter.prototype.off;
        base.prototype.removeListener = EventEmitter.prototype.removeListener;
        base.prototype.emit = EventEmitter.prototype.emit;
        base.prototype.listenerCount = EventEmitter.prototype.listenerCount;
        base.prototype.removeAllListeners = EventEmitter.prototype.removeAllListeners;
    }
}
