import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DepreciatingAssetsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, data: any) {
        try {
            // Set defaults for new fields if they're missing
            const createData: any = {
                userId,
                name: data.name,
                type: data.type,
                purchasePrice: data.purchasePrice,
                purchaseDate: new Date(data.purchaseDate),
                depreciationMethod: data.depreciationMethod,
                rate: data.rate || null,
                usefulLife: data.usefulLife || null,
                isDepreciationEnabled: data.isDepreciationEnabled ?? true,
                notes: data.notes || null,
            };

            // Only add new fields if they exist in the data
            if (data.purchaseCurrency) {
                createData.purchaseCurrency = data.purchaseCurrency;
            }
            if (data.salvageValue) {
                createData.salvageValue = data.salvageValue;
            }

            return this.prisma.depreciatingAsset.create({
                data: createData,
            });
        } catch (error: any) {
            console.error('Error creating depreciating asset:', error);
            // Log specific Prisma error details
            if (error.code) {
                console.error('Prisma Error Code:', error.code);
                console.error('Prisma Error Meta:', error.meta);
            }

            // Re-throw as InternalServerErrorException but with message
            // or better, throw BadRequestException if it's a validation thing.
            // For now, let's throw a more descriptive error.
            throw new Error(`Failed to create asset: ${error.message}`);
        }
    }

    async findAll(userId: string) {
        const assets = await this.prisma.depreciatingAsset.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        // Calculate current value for each asset
        return assets.map(asset => {
            if (!asset.isDepreciationEnabled) {
                return { ...asset, currentValue: asset.currentValue ?? asset.purchasePrice };
            }
            const currentValue = this.calculateCurrentValue(asset);
            return { ...asset, currentValue };
        });
    }

    private calculateCurrentValue(asset: any): number {
        const purchasePrice = Number(asset.purchasePrice);
        const purchaseDate = new Date(asset.purchaseDate);
        const now = new Date();

        // Calculate years elapsed (fractional)
        const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
        const yearsElapsed = diffTime / (1000 * 60 * 60 * 24 * 365.25);

        let currentValue = purchasePrice;

        if (asset.depreciationMethod === 'STRAIGHT_LINE' && asset.usefulLife) {
            // Annual Depreciation = Cost / Useful Life
            const annualDepreciation = purchasePrice / asset.usefulLife;
            const totalDepreciation = annualDepreciation * yearsElapsed;
            currentValue = purchasePrice - totalDepreciation;
        } else if (asset.depreciationMethod === 'PERCENTAGE' && asset.rate) {
            // Declining Balance: Value = Cost * (1 - rate)^years
            const rateDecimal = Number(asset.rate) / 100;
            currentValue = purchasePrice * Math.pow(1 - rateDecimal, yearsElapsed);
        }

        // Ensure value doesn't go below salvage value (if set) or 0
        const salvageValue = asset.salvageValue ? Number(asset.salvageValue) : 0;
        return Math.max(salvageValue, Number(currentValue.toFixed(2)));
    }

    async findOne(id: string, userId: string) {
        const asset = await this.prisma.depreciatingAsset.findFirst({
            where: { id, userId },
        });

        if (asset && asset.isDepreciationEnabled) {
            const calculatedValue = this.calculateCurrentValue(asset);
            return { ...asset, currentValue: calculatedValue };
        }
        return asset;
    }

    async update(id: string, userId: string, data: any) {
        if (data.purchaseDate) {
            data.purchaseDate = new Date(data.purchaseDate);
        }
        return this.prisma.depreciatingAsset.update({
            where: { id, userId },
            data,
        });
    }

    async remove(id: string, userId: string) {
        return this.prisma.depreciatingAsset.delete({
            where: { id, userId },
        });
    }
}
