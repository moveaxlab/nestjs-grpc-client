/* eslint-disable no-console */
import DataLoader from 'dataloader';

export class UncachedDataloader<ID, Type> implements DataLoader<ID, Type> {
  constructor(private readonly fn: (request: ID) => Promise<Type>) {}

  clear(): this {
    console.warn('Method "clear" not implemented in uncached dataloader');
    return this;
  }

  clearAll(): this {
    console.warn('Method "clearAll" not implemented in uncached dataloader');
    return this;
  }

  load(key: ID): Promise<Type> {
    return this.fn(key);
  }

  loadMany(keys: Array<ID>): Promise<Array<Error | Type>> {
    return Promise.all(keys.map(key => this.fn(key)));
  }

  prime(): this {
    console.warn('Method "prime" not implemented in uncached dataloader');
    return this;
  }
}
