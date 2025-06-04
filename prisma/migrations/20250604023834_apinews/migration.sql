-- CreateTable
CREATE TABLE `preference` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category` VARCHAR(191) NOT NULL,
    `userEmail` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `preference_id_key`(`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `preference` ADD CONSTRAINT `preference_userEmail_fkey` FOREIGN KEY (`userEmail`) REFERENCES `user`(`email`) ON DELETE RESTRICT ON UPDATE CASCADE;
