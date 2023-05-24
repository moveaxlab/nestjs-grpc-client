/* eslint-disable max-classes-per-file */
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  Body,
  CacheModule,
  HttpCode,
  INestApplication,
  Post,
} from '@nestjs/common';
import {
  createDataLoaderDecorator,
  DataLoaderForClient,
  GrpcClientForService,
  GrpcDataLoaderInterceptor,
  GrpcDataLoaderProvider,
  Request,
} from '../src';
import { Controller, Injectable, Logger } from '@nestjs/common';
import { Metadata } from '@grpc/grpc-js';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { ManyRequest } from './__generated__/tests/ManyRequest';
import { TestServiceDefinition } from './__generated__/tests/TestService';
import { ManyResponse__Output } from './__generated__/tests/ManyResponse';
import { MergeConfig } from '../src/dataloaders/grpc-dataloader.provider';

type ServiceClient = GrpcClientForService<TestServiceDefinition>;

const mockClient = {
  getSingle: jest.fn(),
  getMany: jest.fn(),
};

@Injectable()
class TestDataloaderProvider extends GrpcDataLoaderProvider<ServiceClient> {
  client: ServiceClient;

  constructor() {
    super();
    this.client = mockClient;
  }

  createMetadata(_: Request): Metadata {
    return new Metadata();
  }

  logger = new Logger(TestDataloaderProvider.name);

  get cacheConfig() {
    return {
      getMany: {
        cacheKeyFn: (request: ManyRequest) => {
          return request.ids!.join(',');
        },
        ttl: 1,
      },
    };
  }

  get mergeConfig(): MergeConfig<ServiceClient> {
    return {
      getMany: {
        mergeInput: (requests: readonly ManyRequest[]): ManyRequest => {
          return {
            ids: requests.flatMap(req => req.ids!),
          };
        },
        splitOutput: (
          requests: readonly ManyRequest[],
          response: ManyResponse__Output
        ): ManyResponse__Output[] => {
          return requests.map(req => ({
            names: Object.fromEntries(
              req.ids!.map(id => [id, response.names![id]])
            ),
          }));
        },
      },
    };
  }
}

const TestService = createDataLoaderDecorator(TestDataloaderProvider);

type TestDataloader = DataLoaderForClient<ServiceClient>;

@Controller()
class TestController {
  logger = new Logger(TestController.name);

  @Post('get-single')
  @HttpCode(200)
  async getSingle(
    @TestService.getSingle() loader: TestDataloader['getSingle'],
    @Body() ids: string[]
  ) {
    const promises = ids.map(id => loader.load({ id }));
    return await Promise.all(promises);
  }

  @Post('get-many')
  @HttpCode(200)
  async getMany(
    @TestService.getMany(true) loader: TestDataloader['getMany'],
    @Body() ids: string[]
  ) {
    const promises = ids.map(id => loader.load({ ids: [id] }));
    return await Promise.all(promises);
  }

  @Post('get-many-no-cache')
  @HttpCode(200)
  async getManyNoCache(
    @TestService.getMany() loader: TestDataloader['getMany'],
    @Body() ids: string[]
  ) {
    const promises = ids.map(id => loader.load({ ids: [id] }));
    return await Promise.all(promises);
  }
}

describe('Test dataloader caching', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      imports: [CacheModule.register()],
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useClass: GrpcDataLoaderInterceptor,
        },
        TestDataloaderProvider,
      ],
    }).compile();

    app = moduleRef.createNestApplication({
      logger: new Logger(),
    });
    await app.init();

    const data: { [key: string]: string } = {
      a: 'Mario',
      b: 'Pippo',
      c: 'Franco',
    };

    mockClient.getMany.mockImplementation(
      (req: ManyRequest): Observable<ManyResponse__Output> => {
        return of({
          names: Object.fromEntries(req.ids!.map(id => [id, data[id]])),
        });
      }
    );
  });

  it('uses global cache', async () => {
    await request(app.getHttpServer())
      .post('/get-many')
      .send(['a', 'b', 'c'])
      .expect(200)
      .expect([
        { names: { a: 'Mario' } },
        { names: { b: 'Pippo' } },
        { names: { c: 'Franco' } },
      ]);

    await request(app.getHttpServer())
      .post('/get-many')
      .send(['b', 'a', 'c'])
      .expect(200)
      .expect([
        { names: { b: 'Pippo' } },
        { names: { a: 'Mario' } },
        { names: { c: 'Franco' } },
      ]);

    expect(mockClient.getMany).toHaveBeenCalledTimes(1);
  });

  it('does not use global cache', async () => {
    await request(app.getHttpServer())
      .post('/get-many-no-cache')
      .send(['a', 'b', 'c'])
      .expect(200)
      .expect([
        { names: { a: 'Mario' } },
        { names: { b: 'Pippo' } },
        { names: { c: 'Franco' } },
      ]);

    await request(app.getHttpServer())
      .post('/get-many-no-cache')
      .send(['b', 'a', 'c'])
      .expect(200)
      .expect([
        { names: { b: 'Pippo' } },
        { names: { a: 'Mario' } },
        { names: { c: 'Franco' } },
      ]);

    expect(mockClient.getMany).toHaveBeenCalledTimes(2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });
});
