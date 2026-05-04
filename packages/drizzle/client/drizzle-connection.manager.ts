import { OnModuleDestroy } from '@nestjs/common';

export class DrizzleConnectionManager<TClient = unknown>
  implements OnModuleDestroy
{
  constructor(
    private readonly client: TClient,
    private readonly shutdown?: (client: TClient) => void | Promise<void>,
  ) {}

  getClient(): TClient {
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    await this.shutdown?.(this.client);
  }
}
