import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class DepreciatingAssetsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, data: any) {
        // Initial calculation of current value
        const currentValue = this.calculateCurrentValue(
            Number(data.purchasePrice),
            new Date(data.purchaseDate),
            Number(data.depreciationRate)
        );

        return this.prisma.depreciatingAsset.create({
            data: {
                userId,
                name: data.name,
                type: data.type,
                purchasePrice: data.purchasePrice,
                purchaseDate: new Date(data.purchaseDate),
                depreciationRate: data.depreciationRate,
                currentValue: currentValue,
                notes: data.notes,
            },
        });
    }

    async findAll(userId: string) {
        const assets = await this.prisma.depreciatingAsset.findMany({
            where: { userId },
            orderBy: { purchaseDate: 'desc' },
        });

        // Recalculate current value on fetch to ensure it's up to date
        // In a real scheduled job system, this would be a daily cron, but here we do it on read for simplicity
        return assets.map(asset => {
            const liveValue = this.calculateCurrentValue(
                Number(asset.purchasePrice),
                new Date(asset.purchaseDate),
                Number(asset.depreciationRate)
            );

            // Optionally update DB if significantly different (optimistic read-only for now unless explicit update needed)
            return { ...asset, currentValue: liveValue };
        });
    }

    async findOne(userId: string, id: string) {
        return this.prisma.depreciatingAsset.findFirst({
            where: { id, userId },
        });
    }

    async update(userId: string, id: string, data: any) {
        // Recalculate if price/date/rate changes
        let currentValue = undefined;
        if (data.purchasePrice || data.purchaseDate || data.depreciationRate) {
            const asset = await this.findOne(userId, id);
            if (asset) {
                currentValue = this.calculateCurrentValue(
                    Number(data.purchasePrice || asset.purchasePrice),
                    new Date(data.purchaseDate || asset.purchaseDate),
                    Number(data.depreciationRate || asset.depreciationRate)
                );
            }
        }

        return this.prisma.depreciatingAsset.update({
            where: { id },
            data: {
                ...data,
                currentValue: currentValue, // Update derived value
                purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
            },
        });
    }

    async remove(userId: string, id: string) {
        return this.prisma.depreciatingAsset.delete({
            where: { id },
        });
    }

    private calculateCurrentValue(purchasePrice: number, purchaseDate: Date, yearlyRate: number): number {
        const now = new Date();
        const ageInMilliseconds = now.getTime() - purchaseDate.getTime();
        const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);

        // Straight-line depreciation based on percentage
        // Value = Price * (1 - (Rate * Years))
        // Example: 10% rate, 2 years. Value = P * (1 - 0.2) = 0.8P

        const depreciationFactor = (yearlyRate / 100) * ageInYears;
        let currentValue = purchasePrice * (1 - depreciationFactor);

        return Math.max(0, currentValue); // Value cannot be negative
    }
}
