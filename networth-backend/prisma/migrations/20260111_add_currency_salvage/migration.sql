-- AlterTable
ALTER TABLE `depreciating_assets` 
ADD COLUMN `purchaseCurrency` VARCHAR(191) NOT NULL DEFAULT 'AED',
ADD COLUMN `salvageValue` DECIMAL(15, 2) NULL;
