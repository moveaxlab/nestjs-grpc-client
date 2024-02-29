/* eslint-disable @typescript-eslint/no-explicit-any */
import DataLoader from 'dataloader';
import { FirstArgumentType, ReturnType } from './util.types';
import { Observable } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { MethodDefinition } from '@grpc/proto-loader';

type Input<Fn> =
  Fn extends MethodDefinition<infer R, any, any, any> ? R : never;

type Output<Fn> =
  Fn extends MethodDefinition<any, any, any, infer R> ? Observable<R> : never;

export type GrpcClientForService<
  Service,
  StreamMethods extends keyof Service = never,
> = Omit<
  {
    [method in keyof Service as string extends method ? never : method]: (
      input: Input<Service[method]>,
      metadata: Metadata
    ) => Output<Service[method]>;
  },
  StreamMethods
> & {
  [method in StreamMethods]: (
    input: Observable<Input<Service[method]>>,
    metadata: Metadata
  ) => Output<Service[method]>;
};

type GetDataLoaderForMethod<C, K extends keyof C> = DataLoader<
  FirstArgumentType<C[K]>,
  ReturnType<C[K]>,
  string
>;

export type DataLoaderForClient<Client> = {
  [method in keyof Client]: GetDataLoaderForMethod<Client, method>;
};
