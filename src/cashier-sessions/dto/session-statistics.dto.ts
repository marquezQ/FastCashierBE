import { ApiProperty } from '@nestjs/swagger';

export class ResponsiblePersonDto {
    @ApiProperty({ description: 'User ID of the responsible person' })
    userId: number;

    @ApiProperty({ description: 'Full name of the responsible person' })
    name: string;

    @ApiProperty({ description: 'Email of the responsible person' })
    email: string;

    @ApiProperty({ description: 'Role of the responsible person' })
    role: string;
}

export class SessionStatisticsDto {
    @ApiProperty({ description: 'Session ID' })
    sessionId: number;

    @ApiProperty({
        description: 'Expected cash amount (initial amount + total cash from sales)',
        example: 150.0,
    })
    expectedCash: number;

    @ApiProperty({
        description: 'Expected QR amount (total QR from sales)',
        example: 75.5,
    })
    expectedQr: number;

    @ApiProperty({
        description: 'Total number of orders in this session',
        example: 12,
    })
    totalOrders: number;

    @ApiProperty({
        description: 'Number of orders paid with cash',
        example: 7,
    })
    cashOrderCount: number;

    @ApiProperty({
        description: 'Number of orders paid with QR',
        example: 5,
    })
    qrOrderCount: number;

    @ApiProperty({
        description: 'Initial amount when session was opened',
        example: 50.0,
    })
    initialAmount: number;

    @ApiProperty({
        description: 'Date and time when session was opened (ISO 8601 format)',
        example: '2026-02-02T08:00:00.000Z',
    })
    openingDate: Date;

    @ApiProperty({
        description: 'Information about the person responsible for this session',
        type: ResponsiblePersonDto,
    })
    responsiblePerson: ResponsiblePersonDto;

    @ApiProperty({
        description: 'Average value per order (total sales / order count)',
        example: 18.79,
    })
    averageOrderValue: number;

    @ApiProperty({
        description: 'Total sales amount for this session',
        example: 225.5,
    })
    totalSales: number;

    @ApiProperty({
        description: 'Current status of the session',
        example: 'OPEN',
        enum: ['OPEN', 'CLOSED'],
    })
    status: string;

    @ApiProperty({
        description: 'Closing date and time (only if session is closed)',
        example: '2026-02-02T20:00:00.000Z',
        required: false,
    })
    closingDate?: Date;
}
