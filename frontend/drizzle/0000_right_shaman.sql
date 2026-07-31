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
CREATE TABLE `AnalyticsEvent` (
	`id` text PRIMARY KEY NOT NULL,
	`event` text NOT NULL,
	`metadata` text,
	`userId` text,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Prediction` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`input` text NOT NULL,
	`result` text NOT NULL,
	`confidence` real,
	`reasoning` text,
	`model` text DEFAULT 'gpt-4o' NOT NULL,
	`category` text,
	`shareSlug` text,
	`srData` text,
	`tokensIn` integer,
	`tokensOut` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Prediction_shareSlug_unique` ON `Prediction` (`shareSlug`);--> statement-breakpoint
CREATE TABLE `Session` (
	`id` text PRIMARY KEY NOT NULL,
	`sessionToken` text NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Session_sessionToken_unique` ON `Session` (`sessionToken`);--> statement-breakpoint
CREATE TABLE `User` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'USER' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_unique` ON `User` (`email`);