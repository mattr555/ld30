window.onload = function(){
	var game = new Phaser.Game(640, 480, Phaser.AUTO,
		'game', {preload: preload, create: create, update: update});

	function preload(){
		game.load.image('lightbg', 'assets/lightbg.png');
		game.load.image('darkbg', 'assets/darkbg.png');
		game.load.image('ground', 'assets/platform.png');
		game.load.image('star', 'assets/star.png');
		game.load.spritesheet('player', 'assets/player.png', 32, 32);

		game.load.audio('jumpSound', 'assets/jump.wav');
		game.load.audio('coinSound', 'assets/coin.wav');
	}

	var worldgroup, platforms, player, backgrounds, cursor, jumpSfx, coinSfx, stars, cKey,
		score = 0;

	function create(){
		game.physics.startSystem(Phaser.Physics.ARCADE);

		//backgrounds
		backgrounds = game.add.group();
		backgrounds.create(0,0,'lightbg');

		//platforms
		platforms = game.add.group();
		platforms.enableBody = true;
		var ground = platforms.create(0, game.world.height-64, 'ground');
		ground.body.immovable = true;
		ground.scale.setTo(2, 2);

		//player
		player = game.add.sprite(30, game.world.height-256, 'player');
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
		setInterval(addStar, 3000);

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
		game.physics.arcade.collide(player, platforms);
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

	function addStar(){
		var star = stars.create(Math.random()*(game.world.width-32), 0, 'star');
		star.body.gravity.y = 50;
		star.body.bounce.y = .5;
	}

	function scoreStar(player, star){
		star.kill();
		score += 10;
		coinSfx.play();
	}

	function rotateWorld() {
		var i = 0;
		var ownInt = setInterval(function(){
			worldgroup.pivot.x = game.world.width / 2;
			worldgroup.pivot.y = game.world.height / 2;
			worldgroup.x = worldgroup.pivot.x;
			worldgroup.y = worldgroup.pivot.y;
			worldgroup.rotation += Math.PI/10
			i++;
			if (i == 10) clearInterval(ownInt);
		}, 200);	
	}
}