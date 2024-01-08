export class PubSub<TObject extends object> {
    #store: TObject;
    subscriberSet: Set<unknown> | Set<(store: TObject) => unknown>;
    constructor(initialObj: TObject = {} as TObject) {
        this.#store = initialObj;
        this.subscriberSet = new Set();
    }

    getStore() {
        return this.#store;
    }

    publish(newObj: Partial<TObject>) {
        this.#store = {...this.#store, ...newObj}

        this.subscriberSet.forEach(subscriber => {
            if(typeof subscriber === 'function'){
                subscriber(this.#store)
            }
        })
    }

    subscribe(cb: (store: TObject) => unknown) {
        this.subscriberSet.add(cb)
    }

    unsubscribe(cb: (store: TObject) => unknown) {
        this.subscriberSet.delete(cb);
    }
}