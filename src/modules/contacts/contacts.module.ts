import { Module } from '@nestjs/common';
import { ContactRole } from './entities/contact-role.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Contact } from './entities/contact.entity';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contact, ContactRole])],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
