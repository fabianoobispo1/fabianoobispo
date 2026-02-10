/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as categories from '../categories.js'
import type * as contacts from '../contacts.js'
import type * as dontPad from '../dontPad.js'
import type * as exerciseCatalog from '../exerciseCatalog.js'
import type * as files from '../files.js'
import type * as payments from '../payments.js'
import type * as recuperaSenha from '../recuperaSenha.js'
import type * as seed from '../seed.js'
import type * as subscriptions from '../subscriptions.js'
import type * as todo from '../todo.js'
import type * as transaction from '../transaction.js'
import type * as user from '../user.js'
import type * as whatsAppCampaign from '../whatsAppCampaign.js'
import type * as workout from '../workout.js'

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from 'convex/server'

declare const fullApi: ApiFromModules<{
  categories: typeof categories
  contacts: typeof contacts
  dontPad: typeof dontPad
  exerciseCatalog: typeof exerciseCatalog
  files: typeof files
  payments: typeof payments
  recuperaSenha: typeof recuperaSenha
  seed: typeof seed
  subscriptions: typeof subscriptions
  todo: typeof todo
  transaction: typeof transaction
  user: typeof user
  whatsAppCampaign: typeof whatsAppCampaign
  workout: typeof workout
}>

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'public'>
>

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'internal'>
>

export declare const components: {}
