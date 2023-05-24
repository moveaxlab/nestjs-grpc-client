import { ExecutionContext } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { ContextType, Request } from './types';

/**
 * Extracts the request object from the execution context.
 * Works for REST and GraphQL gateways.
 *
 * @param context the current execution context.
 */
export function getRequest(context: ExecutionContext): Request {
  switch (context.getType<GqlContextType>()) {
    case 'graphql':
      return GqlExecutionContext.create(context).getContext<ContextType>().req;
    case 'http':
      return context.switchToHttp().getRequest();
    default:
      throw new Error(`Unsupported context type: ${context.getType()}`);
  }
}
