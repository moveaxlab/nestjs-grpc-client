# NestJS gRPC Client
![NPM](https://img.shields.io/npm/l/%40moveaxlab%2Fgraphql-client)
[![npm](https://img.shields.io/npm/v/@moveaxlab/nestjs-grpc-client)](https://www.npmjs.com/package/@moveaxlab/nestjs-grpc-client)
![Static Badge](https://img.shields.io/badge/node_version-_%3E%3D20-green)

This library defines gRPC dataloaders you can inject dynamically in GraphQL resolvers in order to optimize calls via batching and caching.

More about the dataloader pattern at https://github.com/graphql/dataloader

## Installation

```bash
yarn add @moveaxlab/nestjs-grpc-client
```

## Usage

### Dataloaders

gRPC dataloaders are based on gRPC clients defined as follows:
```typescript
// package.client.ts
import { GrpcClientForService } from '@moveax/nestjs-grpc-client';
import { grpcPkg } from 'somewhere'; // import also your autogenerated gRPC package

export type PackageClient = GrpcClientForService<
    grpcPkg.PackageServiceDefinition
>;
// OR
export type PackageClientWithStreamingMethods = GrpcClientForService<
    grpcPkg.PackageServiceDefinition,
    'myClientStreamingMethod' | 'myBidirectionalStreamingMethod'
>;
```

Implement your gRPC dataloader:
```typescript
// package.dataloader.ts
import { Metadata } from '@grpc/grpc-js';
import { GrpcDataLoaderProvider, DataLoaderForClient, Request, createDataLoaderDecorator } from '@moveax/nestjs-grpc-client';
import { Injectable, Logger } from '@nestjs/common';
import { PackageClient } from 'package.client';
import { grpcPkg } from 'somewhere'; // import also your autogenerated gRPC package

@Injectable()
export class PackageDataLoaderProvider extends GrpcDataLoaderProvider<PackageClient> {
    client: PackageClient;
    logger = new Logger(PackageDataLoaderProvider.name);

    createMetadata(_: Request): Metadata {
        const metadata = new Metadata();
        // you can use the Express' request token to authenticate also the gRPC call 
        metadata.set('authorization', req.get('authorization'));
        return metadata;
    }

   get cacheConfig() {
      return {
         someMethod: {
            cacheKeyFn: (request: grpcPkg.ISomeMethodRequest) => {
               return `pkgService.someMethod:${input.param1}-${input.param2}`;
            },
            ttl: 60,
         },
      };
   }
}

export const PackageService = createDataLoaderDecorator(PackageDataLoaderProvider.prototype);

export type PackageDataloader = DataLoaderForClient<PackageClient>;
```

1. The `cacheConfig` getter returns an object containing cache configuration for the various methods.
   If a method needs to be cached, the `cacheConfig` must contain an entry for that method that takes in input
   the method request and returns a string, which will be used as the cache key. A TTL can be specified,
   that will be used if global caching is enabled (see below).
2. The `PackageService` is an object containing a parameter decorator for each method of the gRPC client.
   You can use the decorator in your resolvers to obtain an instance of the dataloader (see below).
3. The `PackageDataloader` is a type containing the types of each method dataloader.
   You can use the type in your resolvers to add type safety to your loaders.

Add the `GrpcDataLoaderInterceptor` to your app in order to load dataloaders relevant for the request at runtime:
```typescript
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { GrpcDataLoaderInterceptor } from '@moveax/nestjs-grpc-client';

@Module({
  provides: [
    {
      provide: APP_INTERCEPTOR,
      useClass: GrpcDataLoaderInterceptor,
    }
  ],
  /* ... */
})
export class AppModule {}
```

Now you can use the dataloader in your resolvers:
```typescript
// imports omitted for lack of will

@Resolver()
class Whatever {
    @Query()
    async getWhatever(
        @PackageService.someMethod() loader: PackageDataloader['someMethod']
    ) {
        const response = await loader.load(/* gRPC request */);
        // do whatever you want with the response now
    }
}
```

### Batching requests

To batch several requests to a given service when doing API composition,
specify the `mergeConfig` inside your dataloader provider.

The `mergeConfig` provides two properties for each endpoint:
- `mergeInput`, that takes an array of requests and combines them to a single request
- `splitOutput`, that takes the original array of requests and a single response,
  and splits it into an array of responses

### Global caching

To use global caching, pass `true` to the loader decorator:
```typescript
// imports omitted for lack of will

@Resolver()
class Whatever {
    @Query()
    async getWhatever(
        @PackageService.someMethod(true) loader: PackageDataloader['someMethod']
    ) {
        const response = await loader.load(/* gRPC request */);
        // do whatever you want with the response now
    }
}
```

The `ttl` must be set to something greater than 0 inside the cacheConfig
for the dataloader, for global caching to work. _The TTL is expressed in seconds._

All requests to that specific dataloader will be cached for `ttl` seconds,
in a cache shared between all calls. __Use global caching with care:__ the global cache will skip all authorization logic
that may live inside your backend services.
