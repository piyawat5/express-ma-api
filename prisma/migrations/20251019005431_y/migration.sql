-- DropForeignKey
ALTER TABLE `Config` DROP FOREIGN KEY `Config_configTypeId_fkey`;

-- DropIndex
DROP INDEX `Config_configTypeId_fkey` ON `Config`;

-- AlterTable
ALTER TABLE `Config` MODIFY `configTypeId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Config` ADD CONSTRAINT `Config_configTypeId_fkey` FOREIGN KEY (`configTypeId`) REFERENCES `ConfigType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
