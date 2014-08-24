window.onload = function(){
	var game = new Phaser.Game(640, 480, Phaser.AUTO,
		'game', {preload: preload, create: create, update: update, render: render});

	function preload(){
		game.load.image('lightbg', 'assets/lightbg.png');
		game.load.image('darkbg', 'assets/darkbg.png');
		game.load.image('ground', 'assets/platform.png');
		game.load.image('star', 'assets/star.png');
		game.load.spritesheet('player', 'assets/player.png', 32, 32);

		game.load.audio('jumpSound', 'assets/jump.wav');
		game.load.audio('coinSound', 'assets/coin.wav');
	}

	var worldgroup, platforms, player, backgrounds, cursor, jumpSfx, coinSfx, stars, cKey, ground,
		score = 0,
		screenWidth = 640,
		screenHeight = 480;

	function create(){
		game.physics.startSystem(Phaser.Physics.ARCADE);
		game.world.setBounds(0,0,screenWidth,screenHeight*2);

		//backgrounds
		backgrounds = game.add.group();
		backgrounds.create(0,0,'lightbg');
		var dbg = backgrounds.create(screenWidth/2, screenHeight*1.5, 'darkbg');
		dbg.anchor.setTo(.5, .5);
		dbg.scale.y *= -1;

		//platforms
		platforms = game.add.group();
		platforms.enableBody = true;
		ground = platforms.create(screenWidth/2, screenHeight, 'ground');
		ground.anchor.setTo(.5,.5);
		ground.scale.setTo(2, 1);
		game.physics.arcade.enable(ground);
		ground.body.immovable = true;

		//player
		player = game.add.sprite(30, screenHeight-200, 'player');
		player.scale.setTo(3,3);
		game.physics.arcade.enable(player);
		player.body.bounce.y = .2;
		player.body.gravity.y = 100;
		player.body.collideWorldBounds = true;

		//player animations
		player.animations.add('left', [0,1], 5, true);
		player.animations.add('right', [3,4], 5, true);

		//stars
		stars = game.add.group();
		stars.enableBody = true;
		addStar();
		game.time.events.loop(3000, addStar, this);

		//worldgroup
		worldgroup = game.add.group();
		worldgroup.add(backgrounds);
		worldgroup.add(player);
		worldgroup.add(platforms);
		worldgroup.add(stars);

		//keyboard control
		cursor = game.input.keyboard.createCursorKeys();
		cKey = game.input.keyboard.addKey(Phaser.Keyboard.C);
		cKey.onDown.add(rotateWorld, this);

		//sounds
		jumpSfx = game.add.audio('jumpSound');
		coinSfx = game.add.audio('coinSound');

	}

	function update(){
		game.physics.arcade.collide(player, platforms, null, checkBodyCollide);
		game.physics.arcade.collide(stars, platforms);
		game.physics.arcade.overlap(player, stars, scoreStar);

		player.body.velocity.x = 0;
		if (cursor.right.isDown){
			player.body.velocity.x = 150;
			player.animations.play('right');
		} else if (cursor.left.isDown){
			player.body.velocity.x = -150;
			player.animations.play('left');
		} else {
			player.animations.stop();
			player.frame = 2;
		}

		if (cursor.up.isDown && player.body.touching.down) {
			player.body.velocity.y = -150;
			jumpSfx.play();
		}
	}

	function render(){
		game.debug.body(player);
		game.debug.body(ground);
		stars.forEachExists(function(i){game.debug.body(i)}, this);
	}

	function checkBodyCollide(obj, gnd){
		return true;
	}

	function addStar(){
		var star = stars.create(Math.random()*(screenWidth-32), 0, 'star');
		star.body.gravity.y = 50;
		star.body.bounce.y = .3 + Math.random()*.2;
		star.anchor.setTo(.5, .5);
	}

	function scoreStar(player, star){
		star.kill();
		score += 10;
		coinSfx.play();
	}

	function rotateWorld(){
		player.body.collideWorldBounds = false;
		player.body.moves = false;
		stars.forEachExists(function(i){i.kill()}, true);
		rotateTo = worldgroup.rotation === Math.PI ? 0 : Math.PI;
		tween = game.add.tween(worldgroup);
		tween.to({rotation: rotateTo}, 1000);
		tween.onUpdateCallback(resetWorldRotation, this);
		tween.onComplete.add(resetPlayerPosition, this);
		tween.start();
	}

	function resetWorldRotation(){
		worldgroup.pivot.x = game.world.width / 2;
		worldgroup.pivot.y = game.world.height / 2;
		worldgroup.x = worldgroup.pivot.x;
		worldgroup.y = worldgroup.pivot.y;
	}

	function resetPlayerPosition(){
		player.kill();
		ground.kill();

		player = game.add.sprite(30, screenHeight-200, 'player');
		ground = platforms.create(screenWidth/2, screenHeight, 'ground');
		ground.scale.setTo(2, 1);
		ground.anchor.set(.5);
		game.physics.arcade.enable(ground);
		ground.body.immovable = true;

		player.scale.setTo(3,3);
		game.physics.arcade.enable(player);
		player.body.bounce.y = .2;
		player.body.gravity.y = 100
		player.body.collideWorldBounds = true;
	}
}