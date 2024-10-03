
CREATE TABLE IF NOT EXISTS `motors` (
	`mid`	INT(11) NOT NULL,
	`name`	TEXT NOT NULL,
	`description`	TEXT,
	`poles`	INTEGER NOT NULL,
	`maxpowerloss`	REAL,
	`openlooperpd`	REAL,
	`sensorlesserpm`	REAL,
	`params`	TEXT
);
CREATE TABLE IF NOT EXISTS `batteries` (
	`bid`	INT(11) NOT NULL,
	`name`	TEXT NOT NULL,
	`type`	TEXT,
	`comments`	TEXT,
	`vfull`	REAL,
	`vnominal`	REAL,
	`vempty`	REAL,
	`vemptyempty`	REAL,
	`diameter`	REAL NOT NULL,
	`length`	REAL NOT NULL,
	`weight`	REAL NOT NULL,
	`amax`	REAL,
	`mahmin`	REAL,
	`mahtypical`	REAL,
	`wh`	REAL
);
CREATE TABLE IF NOT EXISTS `batterypacks` (
	`bpid`	INT(11) NOT NULL,
	`name`	TEXT NOT NULL,
	`description`	TEXT,
	`bid`	INT(11) NOT NULL,
	`ser`	INT(11) NOT NULL,
	`par`	INT(11) NOT NULL,
	`url`	TEXT
);

ALTER TABLE `motors` ADD PRIMARY KEY (`mid`);
ALTER TABLE `batteries` ADD PRIMARY KEY (`bid`);
ALTER TABLE `batterypacks` ADD PRIMARY KEY (`bpid`);


INSERT INTO `motors` (`mid`,`name`,`description`,`poles`,`maxpowerloss`,`openlooperpd`,`sensorlesserpm`,`params`) VALUES (1,'Superflux MK1','The original Fungineers Superflux',30,NULL,NULL,NULL,NULL);
INSERT INTO `motors` (`mid`,`name`,`description`,`poles`,`maxpowerloss`,`openlooperpd`,`sensorlesserpm`,`params`) VALUES (2,'Superflux HT','Fungineers High Torque',30,'',NULL,NULL,NULL);
INSERT INTO `motors` (`mid`,`name`,`description`,`poles`,`maxpowerloss`,`openlooperpd`,`sensorlesserpm`,`params`) VALUES (3,'Superflux HS','Fungineers High Speed',30,NULL,NULL,NULL,NULL);
INSERT INTO `motors` (`mid`,`name`,`description`,`poles`,`maxpowerloss`,`openlooperpd`,`sensorlesserpm`,`params`) VALUES (4,'Hypercore','Original Onewheel Motor',30,NULL,NULL,NULL,NULL);
INSERT INTO `motors` (`mid`,`name`,`description`,`poles`,`maxpowerloss`,`openlooperpd`,`sensorlesserpm`,`params`) VALUES (5,'CannonCore','FloatWheel ADV Motor',30,'',NULL,NULL,NULL);
INSERT INTO `batteries` (`bid`,`name`,`type`,`comments`,`vfull`,`vnominal`,`vempty`,`vemptyempty`,`diameter`,`length`,`weight`,`amax`,`mahmin`,`mahtypical`,`wh`) VALUES (1,'P28A','LiIon','Thin enough for normal battery boxes',4.2,3.65,3.0,2.5,18.6,65.2,46.0,35.0,2800.0,2700.0,9.0);
INSERT INTO `batteries` (`bid`,`name`,`type`,`comments`,`vfull`,`vnominal`,`vempty`,`vemptyempty`,`diameter`,`length`,`weight`,`amax`,`mahmin`,`mahtypical`,`wh`) VALUES (2,'P42A','LiIon','High Torque',4.2,3.65,3.0,2.5,21.2,70.0,66.5,45.0,4000.0,4200.0,14.0);
INSERT INTO `batteries` (`bid`,`name`,`type`,`comments`,`vfull`,`vnominal`,`vempty`,`vemptyempty`,`diameter`,`length`,`weight`,`amax`,`mahmin`,`mahtypical`,`wh`) VALUES (3,'P45B','LiIon','Even higher torque',4.2,3.65,3.0,2.5,21.7,70.2,68.0,45.0,4350.0,4500.0,15.0);
INSERT INTO `batteries` (`bid`,`name`,`type`,`comments`,`vfull`,`vnominal`,`vempty`,`vemptyempty`,`diameter`,`length`,`weight`,`amax`,`mahmin`,`mahtypical`,`wh`) VALUES (4,'M35A','LiIon','',4.2,3.6,3.0,2.5,18.3,65.05,48.0,10.0,3350.0,3500.0,11.6);
INSERT INTO `batteries` (`bid`,`name`,`type`,`comments`,`vfull`,`vnominal`,`vempty`,`vemptyempty`,`diameter`,`length`,`weight`,`amax`,`mahmin`,`mahtypical`,`wh`) VALUES (5,'A123','LiFePO4','Future Motion?',4.0,32.0,2.6,2.3,25.96,65.15,76.0,50.0,2500.0,2600.0,7.5);
INSERT INTO `batterypacks` (`bpid`,`name`,`description`,`bid`,`ser`,`par`,`url`) VALUES (1,'CBXR','Fits in original FM box.',4,15,2,'https://chibatterysystems.com/products/cbxr');
INSERT INTO `batterypacks` (`bpid`,`name`,`description`,`bid`,`ser`,`par`,`url`) VALUES (2,'SUPzero','my favourite',2,16,2,NULL);
INSERT INTO `batterypacks` (`bpid`,`name`,`description`,`bid`,`ser`,`par`,`url`) VALUES (3,'Fungineers','Fungineers complete battery pack 2024',1,20,2,NULL);
