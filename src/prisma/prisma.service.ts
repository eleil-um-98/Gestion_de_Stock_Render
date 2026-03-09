import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool, types } from 'pg';

types.setTypeParser(types.builtins.TIMESTAMP, (stringValue) => {
    return new Date(stringValue + 'Z');
});

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {

    private xPrisma: any;

    constructor() {
        process.env.TZ = 'UTC';

        const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
        const adapter = new PrismaPg(pool);
        super({ adapter });
        this.xPrisma = this.$extends({
            query: {
                $allModels: {
                    async $allOperations({ operation, model, args, query }) {
                        if (operation === 'create') {
                            if (!(args as any).data) (args as any).data = {};
                            if ((args as any).data.createdAt === undefined) {
                                (args as any).data.createdAt = new Date().toISOString();
                            }
                        }

                        if (operation === 'createMany' && (args as any).data) {
                            const records = Array.isArray((args as any).data) ? (args as any).data : [(args as any).data];
                            for (const record of records) {
                                if (record.createdAt === undefined) {
                                    record.createdAt = new Date().toISOString();
                                }
                            }
                        }
                        return query(args);
                    }
                }
            }
        });
    }

    get extended() {
        return this.xPrisma;
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
