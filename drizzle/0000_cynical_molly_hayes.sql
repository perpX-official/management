CREATE TABLE `points_history` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`wallet_address` varchar(128) NOT NULL,
	`transaction_type` varchar(32) NOT NULL,
	`points_change` int NOT NULL,
	`balance_after` int NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `points_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referral_tiers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tier_name` varchar(32) NOT NULL,
	`min_referrals` int NOT NULL,
	`bonus_per_referral` int NOT NULL,
	`percentage_bonus` int NOT NULL DEFAULT 10,
	`tier_color` varchar(16),
	CONSTRAINT `referral_tiers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`referrer_wallet` varchar(128) NOT NULL,
	`referred_wallet` varchar(128) NOT NULL,
	`referral_code` varchar(16) NOT NULL,
	`referrer_points` int NOT NULL DEFAULT 0,
	`referred_points` int NOT NULL DEFAULT 0,
	`referrer_claimed` boolean NOT NULL DEFAULT false,
	`referred_claimed` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`claimed_at` timestamp,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referred_wallet_unique` UNIQUE(`referred_wallet`)
);
--> statement-breakpoint
CREATE TABLE `task_completions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`wallet_address` varchar(128) NOT NULL,
	`task_type` varchar(64) NOT NULL,
	`points_awarded` int NOT NULL,
	`completion_date` varchar(10),
	`metadata` text,
	`status` varchar(16) NOT NULL DEFAULT 'active',
	`completed_at` timestamp NOT NULL DEFAULT (now()),
	`revoked_at` timestamp,
	CONSTRAINT `task_completions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`wallet_address` varchar(128) NOT NULL,
	`name` text,
	`email` varchar(320),
	`role` varchar(16) NOT NULL DEFAULT 'user',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`last_signed_in` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_wallet_address_unique` UNIQUE(`wallet_address`)
);
--> statement-breakpoint
CREATE TABLE `wallet_profiles` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`wallet_address` varchar(128) NOT NULL,
	`chain_type` varchar(16) NOT NULL,
	`total_points` int NOT NULL DEFAULT 0,
	`connect_bonus_claimed` boolean NOT NULL DEFAULT false,
	`x_connected` boolean NOT NULL DEFAULT false,
	`x_username` varchar(64),
	`x_connected_at` timestamp,
	`discord_connected` boolean NOT NULL DEFAULT false,
	`discord_username` varchar(64),
	`discord_connected_at` timestamp,
	`discord_id` varchar(64),
	`discord_verified` boolean NOT NULL DEFAULT false,
	`discord_verified_at` timestamp,
	`referral_code` varchar(16),
	`referred_by` varchar(16),
	`referral_count` int NOT NULL DEFAULT 0,
	`referral_points_earned` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallet_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `wallet_profiles_wallet_address_unique` UNIQUE(`wallet_address`),
	CONSTRAINT `wallet_profiles_referral_code_unique` UNIQUE(`referral_code`)
);
