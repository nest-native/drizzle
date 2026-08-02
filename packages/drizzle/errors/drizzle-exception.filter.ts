import { Catch, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import {
  type DrizzleErrorMappingOptions,
  describeDrizzleError,
  mapDrizzleError,
} from './drizzle-error.mapper';

/**
 * Turns database constraint violations into the HTTP responses they deserve,
 * so services stop wrapping every write in `try { … } catch { mapDrizzleError }`.
 *
 * **Opt-in, never automatic** — the package does not register it for you (the
 * project constitution: error mapping is offered, not imposed). Register it
 * where you want it:
 *
 * ```ts
 * // one controller
 * @UseFilters(new DrizzleExceptionFilter())
 *
 * // or app-wide, in main.ts — needs the HTTP adapter, since anything that is
 * // NOT a constraint violation is delegated to Nest's own handling
 * app.useGlobalFilters(new DrizzleExceptionFilter(app.get(HttpAdapterHost).httpAdapter));
 * ```
 *
 * It only claims errors {@link describeDrizzleError} recognises; everything
 * else falls through to `BaseExceptionFilter` exactly as if this filter were
 * not installed, so adding it cannot change how your other errors behave.
 */
@Catch()
export class DrizzleExceptionFilter
  extends BaseExceptionFilter
  implements ExceptionFilter {
  private readonly options: DrizzleErrorMappingOptions;

  constructor(
    applicationRef?: ConstructorParameters<typeof BaseExceptionFilter>[0],
    options: DrizzleErrorMappingOptions = {},
  ) {
    super(applicationRef);
    this.options = options;
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    if (describeDrizzleError(exception) === undefined) {
      // Not ours — let Nest handle it unchanged.
      super.catch(exception, host);
      return;
    }

    super.catch(mapDrizzleError(exception, this.options), host);
  }
}
