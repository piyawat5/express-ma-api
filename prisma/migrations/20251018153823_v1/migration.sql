-- DropForeignKey
ALTER TABLE `WorkorderItem` DROP FOREIGN KEY `WorkorderItem_configId_fkey`;

-- DropIndex
DROP INDEX `WorkorderItem_configId_fkey` ON `WorkorderItem`;

-- AlterTable
ALTER TABLE `WorkorderItem` MODIFY `configId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `WorkorderItem` ADD CONSTRAINT `WorkorderItem_configId_fkey` FOREIGN KEY (`configId`) REFERENCES `Config`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
