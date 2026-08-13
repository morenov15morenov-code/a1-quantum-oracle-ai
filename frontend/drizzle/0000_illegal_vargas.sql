CREATE TABLE `Account` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `providerProviderAccountId` ON `Account` (`provider`,`providerAccountId`);--> statement-breakpoint
CREATE TABLE `AnalyticsEvent` (
	`id` text PRIMARY KEY NOT NULL,
	`event` text NOT NULL,
	`metadata` text,
	`userId` text,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `PredictionFeedback` (
	`id` text PRIMARY KEY NOT NULL,
	`predictionId` text NOT NULL,
	`userId` text NOT NULL,
	`rating` integer DEFAULT 0 NOT NULL,
	`wasAccurate` integer,
	`comment` text,
	`domain` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`predictionId`) REFERENCES `Prediction`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `PredictionFeedback_predictionId_unique` ON `PredictionFeedback` (`predictionId`);--> statement-breakpoint
CREATE TABLE `Prediction` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`input` text NOT NULL,
	`result` text NOT NULL,
	`confidence` real,
	`reasoning` text,
	`model` text DEFAULT 'gpt-4o' NOT NULL,
	`tokensIn` integer,
	`tokensOut` integer,
	`shareSlug` text,
	`context` text,
	`domainCategory` text,
	`outcomeStatus` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `RateLimit` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`resetAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Session` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `Subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`tier` text DEFAULT 'FREE' NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`predsUsed` integer DEFAULT 0 NOT NULL,
	`predsLimit` integer DEFAULT 1 NOT NULL,
	`periodStart` integer NOT NULL,
	`periodEnd` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Subscription_userId_unique` ON `Subscription` (`userId`);--> statement-breakpoint
CREATE TABLE `User` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer,
	`image` text,
	`password` text DEFAULT '' NOT NULL,
	`role` text DEFAULT 'USER' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`failedAttempts` integer DEFAULT 0 NOT NULL,
	`lockedUntil` integer,
	`passwordResetToken` text,
	`passwordResetExpires` integer,
	`emailVerifyToken` text,
	`emailVerifyExpires` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_unique` ON `User` (`email`);