import { Injectable } from '@nestjs/common';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

@Injectable()
export class DatabaseConfigService {
  readonly databaseFile = join(
    tmpdir(),
    `nest-native-drizzle-sample-03-${process.pid}.db`,
  );

  readonly databaseUrl = `file:${this.databaseFile}`;
  readonly source = process.env.NODE_ENV ?? 'local';
}
