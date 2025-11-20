import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashierSession } from './entities/cashier-session.entity';
import {
  CreateCashierSessionDto,
  CloseCashierSessionDto,
  UpdateCashierSessionDto,
} from './dto';

@Injectable()
export class CashierSessionsService {
  constructor(
    @InjectRepository(CashierSession)
    private readonly sessionRepository: Repository<CashierSession>,
  ) {}

  async create(
    createSessionDto: CreateCashierSessionDto,
  ): Promise<CashierSession> {
    // Verificar si el usuario ya tiene una sesión abierta
    const openSession = await this.sessionRepository.findOne({
      where: {
        userId: createSessionDto.userId,
        status: 'OPEN',
      },
    });

    if (openSession) {
      throw new ConflictException(
        'User already has an open session. Close it before opening a new one.',
      );
    }

    const session = this.sessionRepository.create({
      ...createSessionDto,
      status: 'OPEN',
    });

    return await this.sessionRepository.save(session);
  }

  async findAll(): Promise<CashierSession[]> {
    return await this.sessionRepository.find({
      relations: ['user'],
      order: { openingDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<CashierSession> {
    const session = await this.sessionRepository.findOne({
      where: { idSession: id },
      relations: ['user'],
    });

    if (!session) {
      throw new NotFoundException(`Cashier session with ID ${id} not found`);
    }

    return session;
  }

  async findOpenSessions(): Promise<CashierSession[]> {
    return await this.sessionRepository.find({
      where: { status: 'OPEN' },
      relations: ['user'],
      order: { openingDate: 'DESC' },
    });
  }

  async findByUser(userId: number): Promise<CashierSession[]> {
    return await this.sessionRepository.find({
      where: { userId },
      relations: ['user'],
      order: { openingDate: 'DESC' },
    });
  }

  async findCurrentSession(userId: number): Promise<CashierSession | null> {
    return await this.sessionRepository.findOne({
      where: {
        userId,
        status: 'OPEN',
      },
      relations: ['user'],
    });
  }

  async closeSession(
    id: number,
    closeSessionDto: CloseCashierSessionDto,
  ): Promise<CashierSession> {
    const session = await this.findOne(id);

    if (session.status === 'CLOSED') {
      throw new BadRequestException('Session is already closed');
    }

    // Calcular diferencia
    const expectedCashTotal = session.initialAmount + session.totalCash;
    const expectedQrTotal = session.totalQr;

    const cashDifference =
      closeSessionDto.closingCashAmount - expectedCashTotal;
    const qrDifference = closeSessionDto.closingQrAmount - expectedQrTotal;
    const totalDifference = cashDifference + qrDifference;

    // Actualizar sesión
    session.closingDate = new Date();
    session.closingCashAmount = closeSessionDto.closingCashAmount;
    session.closingQrAmount = closeSessionDto.closingQrAmount;
    session.difference = totalDifference;
    session.status = 'CLOSED';

    if (closeSessionDto.observations) {
      session.observations = closeSessionDto.observations;
    }

    return await this.sessionRepository.save(session);
  }

  async update(
    id: number,
    updateSessionDto: UpdateCashierSessionDto,
  ): Promise<CashierSession> {
    const session = await this.findOne(id);

    if (session.status === 'CLOSED') {
      throw new BadRequestException('Cannot update a closed session');
    }

    this.sessionRepository.merge(session, updateSessionDto);
    return await this.sessionRepository.save(session);
  }

  // Método para actualizar totales cuando se registre una venta
  async updateSessionTotals(
    sessionId: number,
    saleAmount: number,
    paymentMethod: 'CASH' | 'QR',
  ): Promise<void> {
    const session = await this.findOne(sessionId);

    if (session.status === 'CLOSED') {
      throw new BadRequestException('Cannot add sales to a closed session');
    }

    if (paymentMethod === 'CASH') {
      session.totalCash += saleAmount;
    } else if (paymentMethod === 'QR') {
      session.totalQr += saleAmount;
    }

    session.totalSales += saleAmount;
    session.orderCount += 1;

    await this.sessionRepository.save(session);
  }

  async getSessionSummary(id: number) {
    const session = await this.findOne(id);

    const expectedCashTotal = session.initialAmount + session.totalCash;
    const expectedQrTotal = session.totalQr;
    const expectedTotal = expectedCashTotal + expectedQrTotal;

    return {
      session,
      summary: {
        expectedCashTotal,
        expectedQrTotal,
        expectedTotal,
        actualCashTotal: session.closingCashAmount,
        actualQrTotal: session.closingQrAmount,
        actualTotal:
          (session.closingCashAmount || 0) + (session.closingQrAmount || 0),
        difference: session.difference,
        status: session.status,
      },
    };
  }

  async remove(id: number): Promise<void> {
    const session = await this.findOne(id);

    if (session.status === 'OPEN') {
      throw new BadRequestException(
        'Cannot delete an open session. Close it first.',
      );
    }

    if (session.orderCount > 0) {
      throw new BadRequestException(
        'Cannot delete session with registered orders',
      );
    }

    await this.sessionRepository.remove(session);
  }
  // Agregar este método al final de la clase CashierSessionsService
  async addOrderToSession(
    sessionId: number,
    orderTotal: number,
    paymentMethod: 'CASH' | 'QR',
  ): Promise<void> {
    const session = await this.findOne(sessionId);

    if (session.status === 'CLOSED') {
      throw new BadRequestException('Cannot add orders to a closed session');
    }

    if (paymentMethod === 'CASH') {
      session.totalCash = Number(session.totalCash) + Number(orderTotal);
    } else if (paymentMethod === 'QR') {
      session.totalQr = Number(session.totalQr) + Number(orderTotal);
    }

    session.totalSales = Number(session.totalSales) + Number(orderTotal);
    session.orderCount += 1;

    await this.sessionRepository.save(session);
  }
}
