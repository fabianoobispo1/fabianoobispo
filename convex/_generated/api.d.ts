/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as cartoes from "../cartoes.js";
import type * as categories from "../categories.js";
import type * as dashboard from "../dashboard.js";
import type * as files from "../files.js";
import type * as financeiro from "../financeiro.js";
import type * as recuperaSenha from "../recuperaSenha.js";
import type * as todo from "../todo.js";
import type * as transaction from "../transaction.js";
import type * as user from "../user.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  cartoes: typeof cartoes;
  categories: typeof categories;
  dashboard: typeof dashboard;
  files: typeof files;
  financeiro: typeof financeiro;
  recuperaSenha: typeof recuperaSenha;
  todo: typeof todo;
  transaction: typeof transaction;
  user: typeof user;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
