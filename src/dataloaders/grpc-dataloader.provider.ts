/* eslint-disable @typescript-eslint/no-explicit-any */
import DataLoader, { CacheMap } from 'dataloader';
import { firstValueFrom, Observable, throwError } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { Logger } from '@nestjs/common';
import { UncachedDataloader } from './uncached.dataloader';
import { FirstArgumentType, ReturnType } from '../types/util.types';
import { Request } from '../utils';
import { catchError } from 'rxjs/operators';
import LRU from 'lru-cache';

interface CacheSingleConfig<M> {
  cacheKeyFn: (request: FirstArgumentType<M>) => string;
  ttl: number;
}

export type CacheConfig<Client> = Partial<{
  [method in keyof Client]: CacheSingleConfig<Client[method]>;
}>;

interface MergeSingleConfig<M> {
  mergeInput: (
    request: readonly FirstArgumentType<M>[]
  ) => FirstArgumentType<M>;
  splitOutput: (
    request: readonly FirstArgumentType<M>[],
    response: ReturnType<M>
  ) => ReturnType<M>[];
}

export type MergeConfig<Client> = Partial<{
  [method in keyof Client]: MergeSingleConfig<Client[method]>;
}>;

function wrapCache<K, V>(
  cache: LRU<string, Promise<V>>,
  config: CacheSingleConfig<(req: K) => Observable<V>>
): CacheMap<string, Promise<V>> {
  return {
    get: (key: string) => {
      return cache.get(key);
    },
    set: (key: string, value: Promise<V>) => {
      return cache.set(key, value, { ttl: config.ttl * 1000 });
    },
    clear: () => {
      return cache.clear();
    },
    delete: (key: string) => {
      return cache.delete(key);
    },
  };
}

export abstract class GrpcDataLoaderProvider<Client extends object> {
  abstract logger: Logger;

  abstract client: Client;

  generateDataLoader<ID, Type>(
    methodName: string,
    request: Request,
    cache?: LRU<string, Promise<Type>>
  ): DataLoader<ID, Type> {
    this.logger.debug(
      `Creating dataloader ${methodName} in ${this.constructor.name}`
    );

    if (!(methodName in this.client)) {
      throw new Error(
        `Method ${methodName} does not exist on ${this.constructor.name}`
      );
    }

    const call = (
      this.client as unknown as {
        [key: string]: (request: ID, metadata: Metadata) => Observable<Type>;
      }
    )[methodName];

    const metadata = this.createMetadata(request);

    const cacheConfig = this.cacheConfig[methodName as keyof Client] as
      | CacheSingleConfig<(request: ID) => Observable<any>>
      | undefined;

    const mergeConfig = this.mergeConfig[methodName as keyof Client] as
      | MergeSingleConfig<(request: ID) => Observable<any>>
      | undefined;

    if (cacheConfig) {
      const cacheWrapper = cache
        ? wrapCache<ID, Type>(cache, cacheConfig)
        : undefined;
      const logger = this.logger;
      return new DataLoader(
        async keys => {
          const request = mergeConfig ? mergeConfig.mergeInput(keys) : keys[0];
          logger.debug(
            `Calling ${this.constructor.name}.${methodName} with keys:`
          );
          logger.debug(request);
          const result = await this.observableToPromise(
            call.call(this.client, request, metadata),
            this.constructor.name,
            methodName
          );
          return mergeConfig ? mergeConfig.splitOutput(keys, result) : [result];
        },
        {
          cacheKeyFn: cacheConfig.cacheKeyFn,
          batch: !!mergeConfig,
          cacheMap: cacheWrapper,
        }
      );
    } else {
      return new UncachedDataloader((rq: ID) =>
        this.observableToPromise(
          call.call(this.client, rq, metadata),
          this.constructor.name,
          methodName
        )
      );
    }
  }

  abstract createMetadata(request: Request): Metadata;

  private async observableToPromise<R>(
    observable: Observable<R>,
    serviceName: string,
    methodName: string
  ): Promise<R> {
    return firstValueFrom(
      observable.pipe(
        catchError(error => {
          return throwError(
            this.transformException(error, serviceName, methodName)
          );
        })
      )
    );
  }

  transformException(
    error: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _serviceName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _methodName: string
  ): unknown {
    return error;
  }

  get cacheConfig(): CacheConfig<Client> {
    return {};
  }

  get mergeConfig(): MergeConfig<Client> {
    return {};
  }
}
