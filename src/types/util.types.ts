/* eslint-disable @typescript-eslint/no-explicit-any */
import { Observable } from 'rxjs';

export type FirstArgumentType<T> = T extends (
  arg: infer A,
  ...args: any[]
) => any
  ? A
  : never;

export type ReturnType<T> = T extends (...args: any[]) => Observable<infer R>
  ? R
  : void;
