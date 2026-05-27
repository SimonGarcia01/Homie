import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LeadsModule } from '../leads/leads.module';
import { Property } from '../properties/entities/property.entity';
import { PropertiesModule } from '../properties/properties.module';
import { UsersModule } from '../users/users.module';

import { ProspectAccount } from './entities/prospect-account.entity';
import { ProspectFavorite } from './entities/prospect-favorite.entity';
import { ProspectInquiry } from './entities/prospect-inquiry.entity';
import { ProspectsController } from './prospects.controller';
import { ProspectsService } from './prospects.service';

@Module({
    imports: [
        ConfigModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET', 'dev-secret'),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d') as unknown as number,
                },
            }),
        }),
        TypeOrmModule.forFeature([ProspectAccount, ProspectFavorite, ProspectInquiry, Property]),
        UsersModule,
        LeadsModule,
        PropertiesModule,
    ],
    controllers: [ProspectsController],
    providers: [ProspectsService],
    exports: [ProspectsService],
})
export class ProspectsModule {}
