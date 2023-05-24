import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { TestServiceClient as _tests_TestServiceClient, TestServiceDefinition as _tests_TestServiceDefinition } from './tests/TestService';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  tests: {
    ManyRequest: MessageTypeDefinition
    ManyResponse: MessageTypeDefinition
    SingleRequest: MessageTypeDefinition
    SingleResponse: MessageTypeDefinition
    TestService: SubtypeConstructor<typeof grpc.Client, _tests_TestServiceClient> & { service: _tests_TestServiceDefinition }
  }
}

