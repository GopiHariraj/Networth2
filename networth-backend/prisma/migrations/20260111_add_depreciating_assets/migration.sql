-- CreateTable
CREATE TABLE `depreciating_assets` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `purchasePrice` DECIMAL(15, 2) NOT NULL,
    `purchaseDate` DATETIME(3) NOT NULL,
    `depreciationMethod` VARCHAR(191) NOT NULL,
    `rate` DECIMAL(5, 2) NULL,
    `usefulLife` INTEGER NULL,
    `isDepreciationEnabled` BOOLEAN NOT NULL DEFAULT true,
    `currentValue` DECIMAL(15, 2) NULL,
    `linkedLoanId` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `depreciating_assets_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `depreciating_assets` ADD CONSTRAINT `depreciating_assets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
