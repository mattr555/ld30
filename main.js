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

	var worldgroup, platforms, player, backgrounds, cursor, jumpSfx, coinSfx, stars, cKey, hardMode,
		score = 0, scoreText,
		screenWidth = 640,
		screenHeight = 480;

	function create(){
		// ???
		hardMode = (location.search == "?hardMode");

		game.physics.startSystem(Phaser.Physics.ARCADE);
		game.world.setBounds(0,0,640,480*2);

		//backgrounds
		backgrounds = game.add.group();
		backgrounds.create(0,0,'lightbg');

		//platforms
		platforms = game.add.group();
		platforms.enableBody = true;
		var ground = platforms.create(0, screenHeight-64, 'ground');
		ground.body.immovable = true;
		ground.scale.setTo(2, 2);

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

		//score text
		scoreText = game.add.text(10, 10, "0", {'font': 'normal 22pt "Comic Sans MS"'});
	}

	function update(){
		game.physics.arcade.collide(player, platforms);
		game.physics.arcade.collide(stars, platforms);

		if (hardMode) {
			game.physics.arcade.collide(player, stars);
			game.physics.arcade.collide(stars, stars);
		} else {
			game.physics.arcade.overlap(player, stars, scoreStar);
		}

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
		var star = stars.create(Math.random()*(screenWidth-32), 0, 'star');
		star.body.gravity.y = 50;
		star.body.bounce.y = .5;
		if (hardMode) {
			star.body.collideWorldBounds = true;
			star.body.bounce.x = .5;
		}
	}

	function scoreStar(player, star){
		star.kill();
		score += 10;
		scoreText.text = score;
		scoreText.fill = '#'+Math.floor(Math.random()*16777215).toString(16);
		coinSfx.play();
	}

	function rotateWorld(){
		rotateTo = worldgroup.rotation === Math.PI ? 0 : Math.PI;
		tween = game.add.tween(worldgroup);
		tween.to({rotation: rotateTo}, 1000);
		tween.onUpdateCallback(resetWorldRotation, this);
		tween.start();
	}

	function resetWorldRotation(){
		worldgroup.pivot.x = game.world.width / 2;
		worldgroup.pivot.y = game.world.height / 2;
		worldgroup.x = worldgroup.pivot.x;
		worldgroup.y = worldgroup.pivot.y;
	}
}