/*
  Warnings:

  - You are about to drop the `technicial` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `AssignedUser` DROP FOREIGN KEY `AssignedUser_workorderItemId_fkey`;

-- DropForeignKey
ALTER TABLE `AttachmentWorkorder` DROP FOREIGN KEY `AttachmentWorkorder_workorderItemId_fkey`;

-- DropForeignKey
ALTER TABLE `Config` DROP FOREIGN KEY `Config_configTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `WorkorderItem` DROP FOREIGN KEY `WorkorderItem_configId_fkey`;

-- DropForeignKey
ALTER TABLE `WorkorderItem` DROP FOREIGN KEY `WorkorderItem_workorderId_fkey`;

-- DropForeignKey
ALTER TABLE `technicial` DROP FOREIGN KEY `technicial_configId_fkey`;

-- DropIndex
DROP INDEX `AssignedUser_workorderItemId_fkey` ON `AssignedUser`;

-- DropIndex
DROP INDEX `AttachmentWorkorder_workorderItemId_fkey` ON `AttachmentWorkorder`;

-- DropIndex
DROP INDEX `Config_configTypeId_fkey` ON `Config`;

-- DropIndex
DROP INDEX `WorkorderItem_configId_fkey` ON `WorkorderItem`;

-- DropIndex
DROP INDEX `WorkorderItem_workorderId_fkey` ON `WorkorderItem`;

-- AlterTable
ALTER TABLE `WorkorderItem` ADD COLUMN `statusApproveId` INTEGER NULL;

-- DropTable
DROP TABLE `technicial`;

-- CreateTable
CREATE TABLE `Technicial` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `spareNumber` VARCHAR(191) NULL,
    `url` VARCHAR(191) NULL,
    `configId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StatusApprove` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AssignedUser` ADD CONSTRAINT `AssignedUser_workorderItemId_fkey` FOREIGN KEY (`workorderItemId`) REFERENCES `WorkorderItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Config` ADD CONSTRAINT `Config_configTypeId_fkey` FOREIGN KEY (`configTypeId`) REFERENCES `ConfigType`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkorderItem` ADD CONSTRAINT `WorkorderItem_configId_fkey` FOREIGN KEY (`configId`) REFERENCES `Config`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkorderItem` ADD CONSTRAINT `WorkorderItem_statusApproveId_fkey` FOREIGN KEY (`statusApproveId`) REFERENCES `StatusApprove`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkorderItem` ADD CONSTRAINT `WorkorderItem_workorderId_fkey` FOREIGN KEY (`workorderId`) REFERENCES `Workorder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttachmentWorkorder` ADD CONSTRAINT `AttachmentWorkorder_workorderItemId_fkey` FOREIGN KEY (`workorderItemId`) REFERENCES `WorkorderItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Technicial` ADD CONSTRAINT `Technicial_configId_fkey` FOREIGN KEY (`configId`) REFERENCES `Config`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
