import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Χρήση: @Roles('admin') ή @Roles('user', 'admin')
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
