-- DropForeignKey
ALTER TABLE `technicial` DROP FOREIGN KEY `technicial_configId_fkey`;

-- DropIndex
DROP INDEX `technicial_configId_fkey` ON `technicial`;

-- AlterTable
ALTER TABLE `technicial` MODIFY `configId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `technicial` ADD CONSTRAINT `technicial_configId_fkey` FOREIGN KEY (`configId`) REFERENCES `Config`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
