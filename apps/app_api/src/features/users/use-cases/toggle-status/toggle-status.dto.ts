import { IsBoolean } from 'class-validator';

/**
 * Toggle Status - Request DTO
 */
export class ToggleStatusDto {
    @IsBoolean()
    isActive: boolean;
}
