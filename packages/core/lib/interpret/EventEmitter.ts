
export class EventEmitter {
    eventsMap: Map<string, Array<(...args: unknown[]) => unknown> | unknown[]>;
    constructor() {
        this.eventsMap = new Map();
    }
    on(eventName: string, cb: (...args: unknown[]) => unknown) {
        const cbArr = this.eventsMap.get(eventName) ?? [] as unknown[];
        this.eventsMap.set(eventName, [...cbArr, cb])
    }
    off(eventName: string, cb: (...args: unknown[]) => unknown) {
        if(!this.eventsMap.has(eventName)){
            return ;
        }
        const cbArr = [...this.eventsMap.get(eventName) ?? [] as unknown[]];
        const removedListenerIndex = cbArr.findIndex(el => el === cb);
        cbArr.splice(removedListenerIndex, removedListenerIndex === -1 ? 0 : 1)
        if (cbArr.length === 0) {
            this.eventsMap.delete(eventName)
        }
        else
            this.eventsMap.set(eventName, [...cbArr])
    }
    emit(eventName: string, ...args: unknown[]) {
        if (this.eventsMap.has(eventName)) {
            this.eventsMap.get(eventName)?.forEach(event => {
                if (typeof event === 'function')
                    return event(...args)
            })
        }
    }
}
