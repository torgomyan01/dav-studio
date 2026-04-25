-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Хост: 127.0.0.1
-- Время создания: Апр 25 2026 г., 11:11
-- Версия сервера: 10.4.32-MariaDB
-- Версия PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `dav_studio`
--

-- --------------------------------------------------------

--
-- Структура таблицы `accessory`
--

CREATE TABLE `accessory` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `costPrice` decimal(10,2) NOT NULL,
  `quantity` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `imageUrl` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `accessory`
--

INSERT INTO `accessory` (`id`, `name`, `costPrice`, `quantity`, `createdAt`, `updatedAt`, `imageUrl`) VALUES
('cmo5ngfjq0000unz4vmystcbh', 'Նաուշնիկ', 2500.00, 3, '2026-04-19 10:55:14.870', '2026-04-19 11:23:34.474', NULL),
('cmo5pgx6p0006unfc85thy8o8', 'Էկրան Samsung A51', 800.00, 26, '2026-04-19 11:51:36.961', '2026-04-25 08:23:03.376', NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `accessorysale`
--

CREATE TABLE `accessorysale` (
  `id` varchar(191) NOT NULL,
  `accessoryId` varchar(191) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unitSalePrice` decimal(10,2) NOT NULL,
  `totalSalePrice` decimal(10,2) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `accessorysale`
--

INSERT INTO `accessorysale` (`id`, `accessoryId`, `quantity`, `unitSalePrice`, `totalSalePrice`, `createdAt`) VALUES
('cmo5ods5i0001unfcvripmxot', 'cmo5ngfjq0000unz4vmystcbh', 1, 5000.00, 5000.00, '2026-04-19 11:21:10.854'),
('cmo5odzfb0003unfc5rfgzkvh', 'cmo5ngfjq0000unz4vmystcbh', 3, 5000.00, 15000.00, '2026-04-19 11:21:20.279'),
('cmo5oguyy0005unfchw2leo00', 'cmo5ngfjq0000unz4vmystcbh', 3, 13000.00, 39000.00, '2026-04-19 11:23:34.474'),
('cmo5phptq0008unfcbmcounfo', 'cmo5pgx6p0006unfc85thy8o8', 1, 2000.00, 2000.00, '2026-04-19 11:52:14.078'),
('cmodyoiuv0001unswcpcttjm0', 'cmo5pgx6p0006unfc85thy8o8', 1, 4000.00, 4000.00, '2026-04-25 06:31:37.592'),
('cmoe2ntn40001uns83pwyo8rf', 'cmo5pgx6p0006unfc85thy8o8', 2, 6000.00, 12000.00, '2026-04-25 08:23:03.376');

-- --------------------------------------------------------

--
-- Структура таблицы `dailyexpense`
--

CREATE TABLE `dailyexpense` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `spentAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `dailyexpense`
--

INSERT INTO `dailyexpense` (`id`, `title`, `amount`, `description`, `spentAt`, `createdAt`, `updatedAt`) VALUES
('cmoe2q4fx0002uns8hqiaebpx', 'հգյգյ', 2000.00, NULL, '2026-04-25 00:00:00.000', '2026-04-25 08:24:50.685', '2026-04-25 08:24:50.685');

-- --------------------------------------------------------

--
-- Структура таблицы `debt`
--

CREATE TABLE `debt` (
  `id` varchar(191) NOT NULL,
  `sourceType` enum('ACCESSORY_SALE','REPAIR_ORDER') NOT NULL,
  `accessorySaleId` varchar(191) DEFAULT NULL,
  `repairOrderId` varchar(191) DEFAULT NULL,
  `customerName` varchar(191) NOT NULL,
  `customerPhone` varchar(191) NOT NULL,
  `totalAmount` decimal(10,2) NOT NULL,
  `paidAmount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `remainingAmount` decimal(10,2) NOT NULL,
  `status` enum('ACTIVE','PARTIALLY_PAID','PAID','OVERDUE') NOT NULL DEFAULT 'ACTIVE',
  `dueDate` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `debt`
--

INSERT INTO `debt` (`id`, `sourceType`, `accessorySaleId`, `repairOrderId`, `customerName`, `customerPhone`, `totalAmount`, `paidAmount`, `remainingAmount`, `status`, `dueDate`, `createdAt`, `updatedAt`) VALUES
('cmoa4eqo90001uniog0bu758r', 'ACCESSORY_SALE', 'cmo5phptq0008unfcbmcounfo', NULL, 'ijiji', '866545646', 2000.00, 2000.00, 0.00, 'PAID', NULL, '2026-04-22 14:00:54.153', '2026-04-22 14:01:41.171'),
('cmoe2rl4m0004uns8o7ugl3pv', 'REPAIR_ORDER', NULL, 'cmo7chgio0000unloq6k4a97n', 'Arsen', '094556688', 5500.00, 5500.00, 0.00, 'PAID', NULL, '2026-04-25 08:25:58.966', '2026-04-25 08:26:09.974');

-- --------------------------------------------------------

--
-- Структура таблицы `debtpayment`
--

CREATE TABLE `debtpayment` (
  `id` varchar(191) NOT NULL,
  `debtId` varchar(191) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `note` varchar(191) DEFAULT NULL,
  `paidAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `debtpayment`
--

INSERT INTO `debtpayment` (`id`, `debtId`, `amount`, `note`, `paidAt`, `createdAt`) VALUES
('cmoa4fb7a0003unioq40oriyp', 'cmoa4eqo90001uniog0bu758r', 1000.00, NULL, '2026-04-22 14:01:20.758', '2026-04-22 14:01:20.758'),
('cmoa4fl0o0005uniokrfrxj9q', 'cmoa4eqo90001uniog0bu758r', 500.00, NULL, '2026-04-22 14:01:33.481', '2026-04-22 14:01:33.481'),
('cmoa4fqy80007unioiul6bf4j', 'cmoa4eqo90001uniog0bu758r', 500.00, NULL, '2026-04-22 14:01:41.168', '2026-04-22 14:01:41.168'),
('cmoe2rtmb0006uns800rx9axx', 'cmoe2rl4m0004uns8o7ugl3pv', 5500.00, NULL, '2026-04-25 08:26:09.971', '2026-04-25 08:26:09.971');

-- --------------------------------------------------------

--
-- Структура таблицы `passwordresettoken`
--

CREATE TABLE `passwordresettoken` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `tokenHash` varchar(191) NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `repairorder`
--

CREATE TABLE `repairorder` (
  `id` varchar(191) NOT NULL,
  `deviceName` varchar(191) NOT NULL,
  `customerName` varchar(191) NOT NULL,
  `expenses` decimal(10,2) NOT NULL,
  `netProfit` decimal(10,2) NOT NULL,
  `description` text NOT NULL,
  `status` enum('IN_PROGRESS','READY_FOR_PICKUP','COMPLETED') NOT NULL DEFAULT 'IN_PROGRESS',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `customerPhone` varchar(191) DEFAULT NULL,
  `imageUrl` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `repairorder`
--

INSERT INTO `repairorder` (`id`, `deviceName`, `customerName`, `expenses`, `netProfit`, `description`, `status`, `createdAt`, `updatedAt`, `customerPhone`, `imageUrl`) VALUES
('cmo5nu6ig0000unoor0ybtmhj', 'Samsung a52', 'Arman', 2000.00, 5000.00, '', 'COMPLETED', '2026-04-19 11:05:56.344', '2026-04-19 11:06:11.996', NULL, NULL),
('cmo5pjftz0009unfcyrzaa91m', 'Տելեվիզր', 'արսեն', 3000.00, 5000.00, '', 'COMPLETED', '2026-04-19 11:53:34.439', '2026-04-19 11:53:54.620', NULL, NULL),
('cmo7chgio0000unloq6k4a97n', 'samsung  s56', 'Arsen', 500.00, 5000.00, '', 'IN_PROGRESS', '2026-04-20 15:23:39.360', '2026-04-20 15:23:39.360', '094556688', NULL),
('cmo7cmsit0001unlo7in0kifc', 'fdfdg', 'dfgd', 456456.00, 56456.00, '', 'READY_FOR_PICKUP', '2026-04-20 15:27:48.197', '2026-04-25 06:23:01.394', '54654645', '/uploads/repairs/1777098181386-dad7620f-71dc-4f54-9878-33f691206a0d.png');

-- --------------------------------------------------------

--
-- Структура таблицы `user`
--

CREATE TABLE `user` (
  `id` varchar(191) NOT NULL,
  `phone` varchar(191) NOT NULL,
  `name` varchar(191) DEFAULT NULL,
  `passwordHash` varchar(191) NOT NULL,
  `role` enum('ADMIN','MANAGER','WORKER') NOT NULL DEFAULT 'WORKER',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `user`
--

INSERT INTO `user` (`id`, `phone`, `name`, `passwordHash`, `role`, `createdAt`, `updatedAt`) VALUES
('cmo5ledfj0000une0jd6kxs25', '094943389', 'Դավիթ', '$2b$12$XDy7cEIHEJUe0hGCAe8b0eILNPuG1zZJpDE2uR3UtsnlsBTo9WKHu', 'ADMIN', '2026-04-19 09:57:39.583', '2026-04-25 09:11:41.287');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `accessory`
--
ALTER TABLE `accessory`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `accessorysale`
--
ALTER TABLE `accessorysale`
  ADD PRIMARY KEY (`id`),
  ADD KEY `AccessorySale_accessoryId_idx` (`accessoryId`),
  ADD KEY `AccessorySale_createdAt_idx` (`createdAt`);

--
-- Индексы таблицы `dailyexpense`
--
ALTER TABLE `dailyexpense`
  ADD PRIMARY KEY (`id`),
  ADD KEY `DailyExpense_spentAt_idx` (`spentAt`),
  ADD KEY `DailyExpense_createdAt_idx` (`createdAt`);

--
-- Индексы таблицы `debt`
--
ALTER TABLE `debt`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Debt_accessorySaleId_key` (`accessorySaleId`),
  ADD UNIQUE KEY `Debt_repairOrderId_key` (`repairOrderId`),
  ADD KEY `Debt_sourceType_idx` (`sourceType`),
  ADD KEY `Debt_status_idx` (`status`),
  ADD KEY `Debt_createdAt_idx` (`createdAt`),
  ADD KEY `Debt_dueDate_idx` (`dueDate`);

--
-- Индексы таблицы `debtpayment`
--
ALTER TABLE `debtpayment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `DebtPayment_debtId_idx` (`debtId`),
  ADD KEY `DebtPayment_paidAt_idx` (`paidAt`);

--
-- Индексы таблицы `passwordresettoken`
--
ALTER TABLE `passwordresettoken`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `PasswordResetToken_tokenHash_key` (`tokenHash`),
  ADD KEY `PasswordResetToken_userId_idx` (`userId`);

--
-- Индексы таблицы `repairorder`
--
ALTER TABLE `repairorder`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_phone_key` (`phone`);

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `accessorysale`
--
ALTER TABLE `accessorysale`
  ADD CONSTRAINT `AccessorySale_accessoryId_fkey` FOREIGN KEY (`accessoryId`) REFERENCES `accessory` (`id`) ON UPDATE CASCADE;

--
-- Ограничения внешнего ключа таблицы `debt`
--
ALTER TABLE `debt`
  ADD CONSTRAINT `Debt_accessorySaleId_fkey` FOREIGN KEY (`accessorySaleId`) REFERENCES `accessorysale` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Debt_repairOrderId_fkey` FOREIGN KEY (`repairOrderId`) REFERENCES `repairorder` (`id`) ON UPDATE CASCADE;

--
-- Ограничения внешнего ключа таблицы `debtpayment`
--
ALTER TABLE `debtpayment`
  ADD CONSTRAINT `DebtPayment_debtId_fkey` FOREIGN KEY (`debtId`) REFERENCES `debt` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ограничения внешнего ключа таблицы `passwordresettoken`
--
ALTER TABLE `passwordresettoken`
  ADD CONSTRAINT `PasswordResetToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
