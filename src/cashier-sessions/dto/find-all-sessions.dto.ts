import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindAllSessionsDto {
    @ApiPropertyOptional({
        description: 'Predefined period filter',
        enum: ['7d', 'this-month'],
    })
    @IsOptional()
    @IsEnum(['7d', 'this-month'])
    period?: string;

    @ApiPropertyOptional({
        description: 'Custom range start date (ISO 8601)',
        example: '2024-02-01',
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({
        description: 'Custom range end date (ISO 8601)',
        example: '2024-02-28',
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;
}
