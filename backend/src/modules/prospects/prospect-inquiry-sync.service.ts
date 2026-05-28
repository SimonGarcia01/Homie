import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProspectInquiry, ProspectInquiryStatus } from './entities/prospect-inquiry.entity';

const STATUS_ORDER: ProspectInquiryStatus[] = [
    ProspectInquiryStatus.RECEIVED,
    ProspectInquiryStatus.CONTACTED,
    ProspectInquiryStatus.VISIT_SCHEDULED,
    ProspectInquiryStatus.COMPLETED,
    ProspectInquiryStatus.CLOSED,
];

@Injectable()
export class ProspectInquirySyncService {
    constructor(
        @InjectRepository(ProspectInquiry)
        private readonly inquiriesRepo: Repository<ProspectInquiry>,
    ) {}

    async syncByLead(leadId: string, propertyId: string | undefined, status: ProspectInquiryStatus) {
        const inquiry = propertyId
            ? await this.inquiriesRepo.findOne({
                  where: { leadId, propertyId },
                  order: { createdAt: 'DESC' },
              })
            : await this.inquiriesRepo.findOne({
                  where: { leadId },
                  order: { createdAt: 'DESC' },
              });

        if (!inquiry) return;

        const currentIdx = STATUS_ORDER.indexOf(inquiry.status);
        const nextIdx = STATUS_ORDER.indexOf(status);
        if (nextIdx <= currentIdx) return;

        inquiry.status = status;
        await this.inquiriesRepo.save(inquiry);
    }
}
