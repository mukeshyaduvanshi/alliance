import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPaginated,
  getPagination,
  type Paginated,
} from '../../common/pagination';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  async create(
    tenantId: string,
    brandId: string,
    dto: CreateInvoiceDto,
    createdById: string,
  ) {
    return this.prisma.invoice.create({
      data: {
        tenantId,
        brandId,
        poId: dto.poId,
        invoiceNumber: dto.invoiceNumber,
        amount: dto.amount,
        status: dto.status,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        createdById,
      },
    });
  }

  async findAllForBrand(
    tenantId: string,
    brandId: string,
    page?: string | number,
    pageSize?: string | number,
  ): Promise<Paginated<Record<string, unknown>>> {
    const { skip, take, page: p, pageSize: size } = getPagination(page, pageSize);
    const where = { tenantId, brandId };

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: { po: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return buildPaginated(invoices, total, p, size);
  }

  async findOneForBrand(tenantId: string, brandId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId, brandId },
      include: { po: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }
}
