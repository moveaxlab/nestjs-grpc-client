# NestJS gRPC Client

Create gRPC dataloaders for GraphQL and inject them dynamically in your resolvers.

## Installation

```bash
yarn add @moveaxlab/nestjs-grpc-client
```

## Usage

### Dataloaders

gRPC dataloaders are based on gRPC clients (see above).

To implement a gRPC dataloader:
```typescript
// myclient.dataloader.ts
import { GrpcDataLoaderProvider, createDataLoaderDecorator, DataLoaderForClient } from '@moveax/grpc-client';
/* same imports as above */

@Injectable()
export class MyClientDataLoaderProvider
  extends GrpcDataLoaderProvider<MyClient>
  implements OnModuleInit {
  /* client setup is as above */

  get cacheConfig() {
    return {
      myMethod: {
        cacheKeyFn: (request: myservice.IMyMethodRequest) => {
           return `myMethod:${request.id}`;
         },
         ttl: 15,
      },
    };
  }
}

const MyClientService = createDataLoaderDecorator(MyClientDataLoaderProvider.prototype);

type MyClientDataLoader = DataLoaderForClient<MyClient>;
```

1. The `cacheConfig` getter returns an object containing cache configuration for the various methods.
   If a method needs to be cached, the `cacheConfig` must contain an entry for that method that takes in input
   the method request and returns a string, which will be used as the cache key. A TTL can be specified,
   that will be used if global caching is enabled (see below).
2. The `MyClientService` is an object containing a parameter decorator for each method of the gRPC client.
   You can use the decorator in your resolvers to obtain an instance of the dataloader (see below).
3. The `MyClientDataLoader` is a type containing the types of each method dataloader.
   You can use the type in your resolvers to add type safety to your loaders.

Create a metadata interceptor to build metadata for your requests:

```typescript
// metadata.interceptor.ts
import { GrpcMetadataInterceptor } from '@moveax/grpc-client';
import { GraphQLExecutionContext } from '@nestjs/graphql';
import { Metadata } from 'grpc';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MetadataInterceptor extends GrpcMetadataInterceptor {
  populateMetadata(context: GraphQLExecutionContext) {
    const metadata = new Metadata();
    metadata.add('authorization', context.getContext().req.headers('authorization'));
    return metadata;
  }
}
```

Add the gRPC dataloader interceptor and the metadata interceptor in your application, and provide your dataloaders:

```typescript
import { APP_INTERCEPTOR, Module } from '@nestjs/core';
import { GrpcDataLoaderInterceptor } from '@moveax/grpc-client';
import { MetadataInterceptor } from './metadata.interceptor';
import { MyClientDataLoaderProvider } from './myclient-dataloder.provider';

@Module({
  providers: [
    MyClientDataLoaderProvider,
    {
      useClass: GrpcDataLoaderInterceptor,
      provide: APP_INTERCEPTOR,
    },
    {
      useClass: MetadataInterceptor,
      provide: APP_INTERCEPTOR,
    },
  ]
})
/* ... */
```

Use the loader in your resolvers:

```typescript
/* imports omitted for lack of will */

@Injectable()
class Whatever {
  @Query('whatever')
  async getWhatever(
    @Args('someParam') param: string,
    @MyClientService.myMethod() loader: MyClientDataLoader['myMethod']
  ) {
    const response = await loader.load(param);
    /* do whatever you want with the response now */
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
/* imports omitted for lack of will */

@Injectable()
class Whatever {
  @Query('whatever')
  async getWhatever(
    @Args('someParam') param: string,
    // enable global caching
    @MyClientService.myMethod(true) loader: MyClientDataLoader['myMethod']
  ) {
    const response = await loader.load(param);
    /* do whatever you want with the response now */
  }
}
```

The `ttl` must be set to something greater than 0 inside the cacheConfig
for the dataloader, for global caching to work.
The TTL is expressed in seconds.

All requests to that specific dataloader will be cached for `ttl` seconds,
in a cache shared between all calls.
Use global caching with care: the global cache will skip all authorization logic
that may live inside your backend services.
