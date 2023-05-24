import { Request as ExpressRequest } from 'express';
import DataLoader from 'dataloader';
import { GrpcDataLoaderProvider } from '../dataloaders';

export interface Request extends ExpressRequest {
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
}

export interface ContextType {
  req: Request;
}
