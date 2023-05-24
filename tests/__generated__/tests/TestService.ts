// Original file: tests/service.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { ManyRequest as _tests_ManyRequest, ManyRequest__Output as _tests_ManyRequest__Output } from '../tests/ManyRequest';
import type { ManyResponse as _tests_ManyResponse, ManyResponse__Output as _tests_ManyResponse__Output } from '../tests/ManyResponse';
import type { SingleRequest as _tests_SingleRequest, SingleRequest__Output as _tests_SingleRequest__Output } from '../tests/SingleRequest';
import type { SingleResponse as _tests_SingleResponse, SingleResponse__Output as _tests_SingleResponse__Output } from '../tests/SingleResponse';

export interface TestServiceClient extends grpc.Client {
  getMany(argument: _tests_ManyRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_tests_ManyResponse__Output>): grpc.ClientUnaryCall;
  getMany(argument: _tests_ManyRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_tests_ManyResponse__Output>): grpc.ClientUnaryCall;
  getMany(argument: _tests_ManyRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_tests_ManyResponse__Output>): grpc.ClientUnaryCall;
  getMany(argument: _tests_ManyRequest, callback: grpc.requestCallback<_tests_ManyResponse__Output>): grpc.ClientUnaryCall;
  getMany(argument: _tests_ManyRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_tests_ManyResponse__Output>): grpc.ClientUnaryCall;
  getMany(argument: _tests_ManyRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_tests_ManyResponse__Output>): grpc.ClientUnaryCall;
  getMany(argument: _tests_ManyRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_tests_ManyResponse__Output>): grpc.ClientUnaryCall;
  getMany(argument: _tests_ManyRequest, callback: grpc.requestCallback<_tests_ManyResponse__Output>): grpc.ClientUnaryCall;
  
  getSingle(argument: _tests_SingleRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_tests_SingleResponse__Output>): grpc.ClientUnaryCall;
  getSingle(argument: _tests_SingleRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_tests_SingleResponse__Output>): grpc.ClientUnaryCall;
  getSingle(argument: _tests_SingleRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_tests_SingleResponse__Output>): grpc.ClientUnaryCall;
  getSingle(argument: _tests_SingleRequest, callback: grpc.requestCallback<_tests_SingleResponse__Output>): grpc.ClientUnaryCall;
  getSingle(argument: _tests_SingleRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_tests_SingleResponse__Output>): grpc.ClientUnaryCall;
  getSingle(argument: _tests_SingleRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_tests_SingleResponse__Output>): grpc.ClientUnaryCall;
  getSingle(argument: _tests_SingleRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_tests_SingleResponse__Output>): grpc.ClientUnaryCall;
  getSingle(argument: _tests_SingleRequest, callback: grpc.requestCallback<_tests_SingleResponse__Output>): grpc.ClientUnaryCall;
  
}

export interface TestServiceHandlers extends grpc.UntypedServiceImplementation {
  getMany: grpc.handleUnaryCall<_tests_ManyRequest__Output, _tests_ManyResponse>;
  
  getSingle: grpc.handleUnaryCall<_tests_SingleRequest__Output, _tests_SingleResponse>;
  
}

export interface TestServiceDefinition extends grpc.ServiceDefinition {
  getMany: MethodDefinition<_tests_ManyRequest, _tests_ManyResponse, _tests_ManyRequest__Output, _tests_ManyResponse__Output>
  getSingle: MethodDefinition<_tests_SingleRequest, _tests_SingleResponse, _tests_SingleRequest__Output, _tests_SingleResponse__Output>
}
