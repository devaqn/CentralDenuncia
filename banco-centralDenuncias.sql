CREATE DATABASE IF NOT EXISTS canalDenuncia;
USE canalDenuncia;

CREATE TABLE denuncia (
    denunciaId INT PRIMARY KEY AUTO_INCREMENT,
    tipoDenuncia ENUM('anonimo', 'identificado') NOT NULL,
    descOcorrencia TEXT NOT NULL, 
    localOcorrencia VARCHAR(255) NOT NULL,
    dataOcorrencia DATETIME NULL,  
    tipoCRIME ENUM (
        'assedio',
        'vandalismo',
        'trafico',
        'roubo',
        'discIdeologica',
        'ameaca',
        'discRacismo',
        'estelionato',
        'agressaofis',
        'bullyng',
        'cyberBullyng',
        'cyberCrimes',
        'assassinato',
        'outros'
    ) NOT NULL,
    arquivoProva LONGBLOB NULL,
    protocolo VARCHAR(20) UNIQUE NOT NULL,  
    dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
);

CREATE TABLE denunciante (
    denuncianteId INT PRIMARY KEY AUTO_INCREMENT,
    nomeDenunciante VARCHAR(255) NULL,  
    telefone VARCHAR(20) NULL,
    email VARCHAR(255) NOT NULL
);

CREATE TABLE denuncia_denunciante (
    denunciaDenuncianteId INT PRIMARY KEY AUTO_INCREMENT,
    denunciaId INT,
    denuncianteId INT NULL,
    CONSTRAINT fkDenuncia 
    FOREIGN KEY (denunciaId) REFERENCES denuncia(denunciaId),
    CONSTRAINT fkDenunciante
    FOREIGN KEY (denuncianteId) REFERENCES denunciante(denuncianteId)
);

;