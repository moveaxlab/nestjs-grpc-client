import { Request as ExpressRequest } from 'express';
import DataLoader from 'dataloader';
import { GrpcDataLoaderProvider } from '../dataloaders';
import { FastifyRequest } from 'fastify';

type FastifyOrExpressRequest = ExpressRequest | FastifyRequest;

export type Request = FastifyOrExpressRequest & {
  getDataLoader?: (
    service: new (...args: unknown[]) => GrpcDataLoaderProvider<object>,
    method: string,
    useCache?: boolean
  ) => DataLoader<unknown, unknown>;
  dataLoaderCache?: {
    [service: string]: {
      [method: string]: DataLoader<unknown, unknown>;
    };
  };
};

export interface ContextType {
  req: Request;
}
