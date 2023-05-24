import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import DataLoader from 'dataloader';
import { Observable } from 'rxjs';
import { GrpcDataLoaderProvider } from './grpc-dataloader.provider';
import { getRequest, Request } from '../utils';
import LRU from 'lru-cache';

@Injectable()
export class GrpcDataLoaderInterceptor implements NestInterceptor {
  private readonly logger = new Logger(GrpcDataLoaderInterceptor.name);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private lru: LRU<string, any>;

  constructor(private moduleRef: ModuleRef) {
    this.lru = new LRU({
      max: 500,
      ttl: 1000,
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = getRequest(context);

    if (request.getDataLoader === undefined) {
      request.getDataLoader = this.createDataLoaderGetter(request);
    }

    return next.handle();
  }

  private createDataLoaderGetter(
    request: Request
  ): (
    service: new (...args: unknown[]) => GrpcDataLoaderProvider<object>,
    method: string,
    useCache?: boolean
  ) => DataLoader<unknown, unknown> {
    return (service, method, useCache: boolean = false) => {
      if (!request.dataLoaderCache) {
        request.dataLoaderCache = {};
      }

      const cacheKey = service.constructor.name;

      if (!request.dataLoaderCache[cacheKey]) {
        request.dataLoaderCache[cacheKey] = {};
      }

      if (!request.dataLoaderCache[cacheKey][method]) {
        this.logger.debug(`Creating dataloader for ${cacheKey}.${method}`);

        try {
          const loaderClass = this.moduleRef.get<
            GrpcDataLoaderProvider<object>
          >(service, {
            strict: false,
          });

          request.dataLoaderCache[cacheKey][method] =
            loaderClass.generateDataLoader(
              method,
              request,
              useCache ? this.lru : undefined
            );
        } catch (e) {
          this.logger.error(
            `The loader ${cacheKey}.${method} is not provided: ${e}`
          );
          throw new InternalServerErrorException(
            `The loader ${cacheKey}.${method} is not provided: ${e}`
          );
        }
      }

      return request.dataLoaderCache[cacheKey][method];
    };
  }
}
