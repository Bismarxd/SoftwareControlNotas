-- CreateTable
CREATE TABLE `asignatura` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `semestreId` INTEGER NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `sigla` VARCHAR(191) NOT NULL,
    `nivel` VARCHAR(191) NOT NULL,
    `prerequisito` VARCHAR(191) NOT NULL,
    `area` VARCHAR(191) NOT NULL,
    `hp` INTEGER NOT NULL,
    `hc` INTEGER NOT NULL,
    `haa` INTEGER NOT NULL,
    `hip` INTEGER NOT NULL,
    `he` INTEGER NOT NULL,
    `creditos` INTEGER NOT NULL,
    `justificacion` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,
    `eliminado` BOOLEAN NOT NULL DEFAULT false,
    `seleccionado` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NULL,

    INDEX `Asignatura_semestreId_fkey`(`semestreId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `competencia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `asignaturaId` INTEGER NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `porcentaje` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `eliminado` BOOLEAN NOT NULL DEFAULT false,

    INDEX `Competencia_asignaturaId_fkey`(`asignaturaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `criterioevaluacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `competenciaId` INTEGER NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `porcentaje` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `eliminado` BOOLEAN NOT NULL DEFAULT false,

    INDEX `CriterioEvaluacion_competenciaId_fkey`(`competenciaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estrategia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `asignaturaId` INTEGER NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `eliminado` BOOLEAN NOT NULL DEFAULT false,

    INDEX `Estrategia_asignaturaId_fkey`(`asignaturaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `objetivos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `asignaturaId` INTEGER NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,
    `eliminado` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NULL,

    INDEX `Objetivos_asignaturaId_fkey`(`asignaturaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recursos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `asignaturaId` INTEGER NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `eliminado` BOOLEAN NOT NULL DEFAULT false,

    INDEX `Recursos_asignaturaId_fkey`(`asignaturaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `semestre` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `fechaInicio` DATETIME(3) NOT NULL,
    `estado` BOOLEAN NOT NULL,
    `fechaFin` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `eliminado` BOOLEAN NOT NULL DEFAULT false,
    `seleccionado` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    INDEX `Semestre_usuarioId_fkey`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombreUsuario` VARCHAR(191) NOT NULL,
    `contrasena` VARCHAR(191) NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Usuario_nombreUsuario_key`(`nombreUsuario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `asignatura` ADD CONSTRAINT `Asignatura_semestreId_fkey` FOREIGN KEY (`semestreId`) REFERENCES `semestre`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competencia` ADD CONSTRAINT `Competencia_asignaturaId_fkey` FOREIGN KEY (`asignaturaId`) REFERENCES `asignatura`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `criterioevaluacion` ADD CONSTRAINT `CriterioEvaluacion_competenciaId_fkey` FOREIGN KEY (`competenciaId`) REFERENCES `competencia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estrategia` ADD CONSTRAINT `Estrategia_asignaturaId_fkey` FOREIGN KEY (`asignaturaId`) REFERENCES `asignatura`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `objetivos` ADD CONSTRAINT `Objetivos_asignaturaId_fkey` FOREIGN KEY (`asignaturaId`) REFERENCES `asignatura`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recursos` ADD CONSTRAINT `Recursos_asignaturaId_fkey` FOREIGN KEY (`asignaturaId`) REFERENCES `asignatura`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `semestre` ADD CONSTRAINT `Semestre_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
