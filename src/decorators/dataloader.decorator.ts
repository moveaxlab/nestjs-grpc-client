/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  GrpcDataLoaderProvider,
  GrpcDataLoaderInterceptor,
} from '../dataloaders';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { getRequest } from '../utils';

const Rpc = createParamDecorator<
  [
    new (...args: any[]) => GrpcDataLoaderProvider<object>,
    string,
    boolean | undefined,
  ]
>(([service, method, useCache], context: ExecutionContext) => {
  const request = getRequest(context);

  if (request.getDataLoader === undefined) {
    throw new InternalServerErrorException(`
            You should provide interceptor ${GrpcDataLoaderInterceptor.name} globaly with ${APP_INTERCEPTOR}
          `);
  }

  return request.getDataLoader(service, method, useCache);
});

export function createDataLoaderDecorator<
  C extends object,
  T extends GrpcDataLoaderProvider<C>,
>(
  loaderClass: new (...args: any[]) => T
): T extends GrpcDataLoaderProvider<infer C>
  ? { [key in keyof C]: (useCache?: boolean) => ParameterDecorator }
  : never {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return new Proxy(
    {},
    {
      get(_: unknown, property: string) {
        return (useCache?: boolean) => Rpc([loaderClass, property, useCache]);
      },
    }
  );
}
