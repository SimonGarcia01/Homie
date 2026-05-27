import { SetMetadata } from '@nestjs/common';

export const IS_PROSPECT_AUTH_KEY = 'isProspectAuth';
export const ProspectAuth = () => SetMetadata(IS_PROSPECT_AUTH_KEY, true);
