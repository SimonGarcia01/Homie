import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ContactsModule } from '../contacts/contacts.module';

import { Owner } from './entities/owner.entity';
import { OwnersController } from './owners.controller';
import { OwnersService } from './owners.service';

@Module({
    imports: [TypeOrmModule.forFeature([Owner]), ContactsModule],
    controllers: [OwnersController],
    providers: [OwnersService],
    exports: [OwnersService],
})
export class OwnersModule {}
