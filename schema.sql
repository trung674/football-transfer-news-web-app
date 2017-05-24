-- MySQL dump 10.10
--
-- Host: stusql.dcs.shef.ac.uk    Database: team087
-- ------------------------------------------------------
-- Server version	5.5.50-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `db_player_names`
--

DROP TABLE IF EXISTS `db_player_names`;
CREATE TABLE `db_player_names` (
  `player_ID` int(11) NOT NULL,
  `player_name` varchar(70) NOT NULL,
  `player_twitter` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`player_ID`),
  UNIQUE KEY `player_ID_UNIQUE` (`player_ID`),
  UNIQUE KEY `player_twitter_UNIQUE` (`player_twitter`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table `query`
--

DROP TABLE IF EXISTS `query`;
CREATE TABLE `query` (
  `query_id` int(11) NOT NULL AUTO_INCREMENT,
  `query_text` varchar(200) DEFAULT NULL,
  `player_name` varchar(100) DEFAULT NULL,
  `team` varchar(100) DEFAULT NULL,
  `author` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`query_id`),
  UNIQUE KEY `query_id_UNIQUE` (`query_id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=latin1;

--
-- Table structure for table `tweet`
--

DROP TABLE IF EXISTS `tweet`;
CREATE TABLE `tweet` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `tweet_id` varchar(30) NOT NULL,
  `tweet_text` tinytext NOT NULL,
  `username` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL,
  `retrieved_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `query_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `query_id_idx` (`query_id`),
  CONSTRAINT `query_id` FOREIGN KEY (`query_id`) REFERENCES `query` (`query_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14123 DEFAULT CHARSET=latin1;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2017-05-24 15:20:52
