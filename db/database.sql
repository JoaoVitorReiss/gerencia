-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: contabilidade
-- ------------------------------------------------------
-- Server version	8.0.42

CREATE DATABASE IF NOT EXISTS `contabilidade`;
USE `contabilidade`;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `tiposervico`
--

DROP TABLE IF EXISTS `tiposervico`;
CREATE TABLE `tiposervico` (
  `tipo_tiposervico` int NOT NULL,
  `descricao_tiposervico` varchar(100) NOT NULL,
  PRIMARY KEY (`tipo_tiposervico`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `funcionarios`
--

DROP TABLE IF EXISTS `funcionarios`;
CREATE TABLE `funcionarios` (
  `id_funcionario_funcionario` int NOT NULL AUTO_INCREMENT,
  `nome_funcionario_funcionario` varchar(60) NOT NULL,
  `email_funcionario_funcionario` varchar(60) NOT NULL,
  `senha_funcionario_funcionario` varchar(255) NOT NULL,
  `tipo_funcionario_funcionario` int NOT NULL,
  `cpf_funcionario` varchar(14) DEFAULT NULL,
  `salario_funcionario` decimal(10,2) DEFAULT NULL,
  `data_admissao` date DEFAULT NULL,
  `data_demissao` date DEFAULT NULL,
  `telefone_funcionario` varchar(20) DEFAULT NULL,
  `foto_url` varchar(255) DEFAULT NULL,
  `ultimo_login` datetime DEFAULT NULL,
  `ultima_atividade` datetime DEFAULT NULL,
  `status_online` tinyint(1) DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_funcionario_funcionario`),
  UNIQUE KEY `cpf_funcionario` (`cpf_funcionario`),
  KEY `fk_tipocliente` (`tipo_funcionario_funcionario`),
  CONSTRAINT `fk_tipocliente` FOREIGN KEY (`tipo_funcionario_funcionario`) REFERENCES `tiposervico` (`tipo_tiposervico`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `auditoria_vendas`
--

DROP TABLE IF EXISTS `auditoria_vendas`;
CREATE TABLE `auditoria_vendas` (
  `id_auditoria` int NOT NULL AUTO_INCREMENT,
  `id_transacao_ref` varchar(255) NOT NULL,
  `id_funcionario_auditor` int NOT NULL,
  `tipo_acao` enum('DEVOLUCAO','TROCA','REEMBOLSO','CANCELAMENTO') NOT NULL,
  `valor_estornado` float DEFAULT '0',
  `motivo` text NOT NULL,
  `data_auditoria` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_auditoria`),
  KEY `fk_transacao_idx` (`id_transacao_ref`),
  KEY `fk_fun_auditor` (`id_funcionario_auditor`),
  CONSTRAINT `fk_fun_auditor` FOREIGN KEY (`id_funcionario_auditor`) REFERENCES `funcionarios` (`id_funcionario_funcionario`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `produtos`
--

DROP TABLE IF EXISTS `produtos`;
CREATE TABLE `produtos` (
  `id_produto_produto` int NOT NULL AUTO_INCREMENT,
  `descri_produto` varchar(100) NOT NULL,
  `preco_produto` float NOT NULL,
  `qtd_produto` int NOT NULL,
  `validade` date DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_produto_produto`),
  UNIQUE KEY `descri_produto_UNIQUE` (`descri_produto`)
) ENGINE=InnoDB AUTO_INCREMENT=1468 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `estoque_logs`
--

DROP TABLE IF EXISTS `estoque_logs`;
CREATE TABLE `estoque_logs` (
  `id_log` int NOT NULL AUTO_INCREMENT,
  `id_produto_log` int DEFAULT NULL,
  `id_usuario_log` int NOT NULL,
  `anterior` text,
  `novo` text,
  `motivo` varchar(100) NOT NULL,
  `data_hora` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_log`),
  KEY `fk_produto` (`id_produto_log`),
  KEY `fk_usuario` (`id_usuario_log`),
  CONSTRAINT `fk_produto` FOREIGN KEY (`id_produto_log`) REFERENCES `produtos` (`id_produto_produto`),
  CONSTRAINT `fk_usuario` FOREIGN KEY (`id_usuario_log`) REFERENCES `funcionarios` (`id_funcionario_funcionario`)
) ENGINE=InnoDB AUTO_INCREMENT=357 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `funcionario_logs`
--

DROP TABLE IF EXISTS `funcionario_logs`;
CREATE TABLE `funcionario_logs` (
  `id_log` int NOT NULL AUTO_INCREMENT,
  `id_funcionario_log` int NOT NULL,
  `id_usuario_log` int NOT NULL,
  `anterior` text,
  `novo` text,
  `motivo` varchar(150) NOT NULL,
  `data_hora` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_log`),
  KEY `fk_funcionario_log` (`id_funcionario_log`),
  KEY `fk_usuario_log` (`id_usuario_log`),
  CONSTRAINT `fk_funcionario_log` FOREIGN KEY (`id_funcionario_log`) REFERENCES `funcionarios` (`id_funcionario_funcionario`),
  CONSTRAINT `fk_usuario_log` FOREIGN KEY (`id_usuario_log`) REFERENCES `funcionarios` (`id_funcionario_funcionario`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `mensagens`
--

DROP TABLE IF EXISTS `mensagens`;
CREATE TABLE `mensagens` (
  `id_mensagem` int NOT NULL AUTO_INCREMENT,
  `id_remetente` int NOT NULL,
  `id_destinatario` int NOT NULL,
  `mensagem_texto` text NOT NULL,
  `data_envio` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lida` tinyint(1) NOT NULL DEFAULT '0',
  `excluida` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id_mensagem`),
  KEY `idx_conversa` (`id_remetente`,`id_destinatario`),
  KEY `idx_nao_lidas` (`id_destinatario`,`lida`),
  CONSTRAINT `fk_mensagem_destinatario` FOREIGN KEY (`id_destinatario`) REFERENCES `funcionarios` (`id_funcionario_funcionario`) ON DELETE CASCADE,
  CONSTRAINT `fk_mensagem_remetente` FOREIGN KEY (`id_remetente`) REFERENCES `funcionarios` (`id_funcionario_funcionario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `vendas`
--

DROP TABLE IF EXISTS `vendas`;
CREATE TABLE `vendas` (
  `id_produto_venda` int NOT NULL,
  `id_vendedor_venda` int NOT NULL,
  `data_venda` date NOT NULL,
  `data_venda_dia` varchar(15) DEFAULT NULL,
  `venda_metodo_paga` varchar(30) DEFAULT NULL,
  `venda_valor` float NOT NULL,
  `venda_troco` float NOT NULL,
  `venda_data_hora` time DEFAULT NULL,
  `venda_valor_receb` float DEFAULT NULL,
  `venda_quantidade_itens` int NOT NULL,
  `id_transacao` varchar(255) NOT NULL,
  `venda_preco_unitario` float NOT NULL,
  `status_venda` varchar(20) DEFAULT 'concluida',
  KEY `fkidfun` (`id_vendedor_venda`),
  CONSTRAINT `fkidfun` FOREIGN KEY (`id_vendedor_venda`) REFERENCES `funcionarios` (`id_funcionario_funcionario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
