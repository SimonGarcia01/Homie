import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { RolesGuard } from './common/auth/roles.guard';
import { ActivitiesModule } from './modules/activities/activities.module';
import { AmenitiesModule } from './modules/amenities/amenities.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { LeadsModule } from './modules/leads/leads.module';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { OwnersModule } from './modules/owners/owners.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { RentalApplicationsModule } from './modules/rental-applications/rental-applications.module';
import { RentalContractsModule } from './modules/rental-contracts/rental-contracts.module';
import { RentalEvaluationsModule } from './modules/rental-evaluations/rental-evaluations.module';
import { RolesModule } from './modules/roles/roles.module';
import { SeedModule } from './scripts/seed.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { UsersModule } from './modules/users/users.module';
import { VisitsModule } from './modules/visits/visits.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const databaseUrl = configService.get<string>('DATABASE_URL');
                const isProd = configService.get<string>('NODE_ENV') === 'production';
                const useSsl = configService.get<string>('DB_SSL', isProd ? 'true' : 'false') === 'true';

                return {
                    type: 'postgres' as const,
                    url: databaseUrl,
                    host: databaseUrl ? undefined : configService.get<string>('DB_HOST', 'localhost'),
                    port: databaseUrl ? undefined : Number(configService.get<string>('DB_PORT', '5432')),
                    username: databaseUrl ? undefined : configService.get<string>('DB_USERNAME', 'postgres'),
                    password: databaseUrl ? undefined : configService.get<string>('DB_PASSWORD', 'postgres'),
                    database: databaseUrl ? undefined : configService.get<string>('DB_DATABASE', 'rental_crm_nest'),
                    autoLoadEntities: true,
                    synchronize: configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
                    ssl: useSsl ? { rejectUnauthorized: false } : false,
                };
            },
        }),
        OrganizationsModule,
        RolesModule,
        UsersModule,
        AuthModule,
        ContactsModule,
        LeadsModule,
        OwnersModule,
        AmenitiesModule,
        PropertiesModule,
        OpportunitiesModule,
        ActivitiesModule,
        TasksModule,
        VisitsModule,
        RentalApplicationsModule,
        DocumentsModule,
        RentalEvaluationsModule,
        RentalContractsModule,
        SeedModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
    ],
})
export class AppModule {}
