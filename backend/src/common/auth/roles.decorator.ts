import { SetMetadata } from '@nestjs/common';

import { UserRoleName } from '../enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRoleName[]) => SetMetadata(ROLES_KEY, roles);
