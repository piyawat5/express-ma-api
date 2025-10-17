/*
  Warnings:

  - The values [WorkorderType] on the enum `Config_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Config` MODIFY `type` ENUM('TECHNICIAL', 'WORKORDERTYPE') NOT NULL DEFAULT 'TECHNICIAL';
