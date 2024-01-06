export class PubSub {
    store: object;
    subscriberSet: Set<unknown> | Set<(store: object) => unknown>;
    constructor(initialObj: object) {
        this.store = initialObj;
        this.subscriberSet = new Set();
    }

    publish(newObj: object) {
        this.store = newObj;

        this.subscriberSet.forEach(subscriber => {
            if(typeof subscriber === 'function'){
                subscriber(this.store)
            }
        })
    }

    subscribe(cb: (store: object) => unknown) {
        this.subscriberSet.add(cb)
    }

    unsubscribe(cb: (store: object) => unknown) {
        this.subscriberSet.delete(cb);
    }
}