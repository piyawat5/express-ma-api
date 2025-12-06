/*
  Warnings:

  - You are about to drop the `AssignedUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `AssignedUser` DROP FOREIGN KEY `AssignedUser_userId_fkey`;

-- DropForeignKey
ALTER TABLE `AssignedUser` DROP FOREIGN KEY `AssignedUser_workorderItemId_fkey`;

-- AlterTable
ALTER TABLE `WorkorderItem` ADD COLUMN `approveId` VARCHAR(191) NULL,
    ADD COLUMN `ownerId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `AssignedUser`;

-- AddForeignKey
ALTER TABLE `WorkorderItem` ADD CONSTRAINT `WorkorderItem_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkorderItem` ADD CONSTRAINT `WorkorderItem_approveId_fkey` FOREIGN KEY (`approveId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
