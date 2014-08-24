window.onload = function(){
    var screenWidth = 640,
        screenHeight = 480;

    function StartState() {}
    StartState.prototype = {
        preload: function(){
            this.game.load.image('lightbg', 'assets/lightbg.png');
            this.game.load.image('darkbg', 'assets/darkbg.png');
            this.game.load.image('ground', 'assets/platform.png');
            this.game.load.image('star', 'assets/star.png');
            this.game.load.spritesheet('player', 'assets/player.png', 32, 32);
            this.game.load.image('title', 'assets/title.png');
            this.game.load.image('play', 'assets/play.png');

            this.game.load.audio('jumpSound', 'assets/jump.wav');
            this.game.load.audio('coinSound', 'assets/coin.wav');
        },
        create: function(){
            this.game.add.sprite(0,0,'lightbg');
            var ground = this.game.add.sprite(screenWidth/2, screenHeight, 'ground');
            ground.anchor.setTo(.5,.5);
            ground.scale.setTo(2, 1);

            var title = this.game.add.sprite(screenWidth / 2 + 25, screenHeight / 2 - 100, 'title');
            title.anchor.set(.5);
            var startBtn = this.game.add.button(screenWidth / 2, screenHeight - 150, 'play', this.startGame, this);
            startBtn.anchor.set(.5);
        },
        startGame: function(){
            this.game.state.start('game');
        }
    }

    function GameState() {}
    GameState.prototype = {
        create: function(){
            this.physics.startSystem(Phaser.Physics.ARCADE);
            this.world.setBounds(0,0,screenWidth,screenHeight*2);

            //backgrounds
            this.backgrounds = this.game.add.group();
            this.backgrounds.create(0,0,'lightbg');
            var dbg = this.backgrounds.create(screenWidth/2, screenHeight*1.5, 'darkbg');
            dbg.anchor.setTo(.5, .5);
            dbg.scale.y *= -1;

            //platforms
            this.platforms = this.game.add.group();
            this.platforms.enableBody = true;
            this.ground = this.platforms.create(screenWidth/2, screenHeight, 'ground');
            this.ground.anchor.setTo(.5,.5);
            this.ground.scale.setTo(2, 1);
            this.physics.arcade.enable(this.ground);
            this.ground.body.immovable = true;

            this.player = this.createPlayer();

            //stars
            this.stars = this.game.add.group();
            this.stars.enableBody = true;
            this.addStar();
            this.starTimer = this.time.create(false);
            this.starTimer.loop(3000, this.addStar, this);
            this.starTimer.start();

            //worldgroup
            this.worldgroup = this.game.add.group();
            this.worldgroup.add(this.backgrounds);
            this.worldgroup.add(this.player);
            this.worldgroup.add(this.platforms);
            this.worldgroup.add(this.stars);

            //keyboard control
            this.cursor = this.game.input.keyboard.createCursorKeys();
            this.cKey = this.game.input.keyboard.addKey(Phaser.Keyboard.C);
            this.cKey.onDown.add(this.rotateWorld, this);
            this.qKey = this.game.input.keyboard.addKey(Phaser.Keyboard.Q);
            this.qKey.onDown.add(function(){this.game.state.start('start')}, this);

            //sounds
            this.jumpSfx = this.game.add.audio('jumpSound');
            this.coinSfx = this.game.add.audio('coinSound');

            //score
            this.scoreText = this.game.add.text(10, 10, '0');

            this.flipState = true;
            this.score = 0;
        },
        createPlayer: function(){ //lol @ good practices and OOP
            //player
            var player = game.add.sprite(30, screenHeight-200, 'player');
            player.scale.setTo(3,3);
            game.physics.arcade.enable(player);
            player.body.bounce.y = .2;
            player.body.gravity.y = 100;
            player.body.collideWorldBounds = true;

            //player animations
            player.animations.add('left', [0,1], 5, true);
            player.animations.add('right', [3,4], 5, true);

            return player;
        },

        update: function(){
            this.physics.arcade.collide(this.player, this.platforms);
            this.physics.arcade.collide(this.stars, this.platforms);
            this.physics.arcade.overlap(this.player, this.stars, this.scoreStar, null, this);

            this.player.body.velocity.x = 0;
            if (this.cursor.right.isDown){
                this.player.body.velocity.x = 150;
                this.player.animations.play('right');
            } else if (this.cursor.left.isDown){
                this.player.body.velocity.x = -150;
                this.player.animations.play('left');
            } else {
                this.player.animations.stop();
                this.player.frame = 2;
            }

            if (this.cursor.up.isDown && this.player.body.touching.down) {
                this.player.body.velocity.y = -150;
                this.jumpSfx.play();
            }
        },

        addStar: function(){
            var star = this.stars.create(this.world.randomX, 0, 'star');
            star.body.gravity.y = 50;
            star.body.bounce.y = .3 + Math.random()*.2;
            star.anchor.setTo(.5, .5);
        },
        scoreStar: function(player, star){
            star.kill();
            this.score += 10;
            this.updateScore();
            this.coinSfx.play();
        },

        updateScore: function(){
            this.scoreText.text = this.score.toString();
        },

        rotateWorld: function(){
            this.player.body.collideWorldBounds = false;
            this.player.body.moves = false;
            this.stars.forEachExists(function(i){i.kill()}, true);

            var rotateTo = this.flipState ? Math.PI : 0;
            var tween = this.game.add.tween(this.worldgroup);
            tween.to({rotation: rotateTo}, 1000);
            tween.onUpdateCallback(this.resetWorldRotation, this);
            tween.onComplete.add(this.resetPlayerPosition, this);
            tween.start();
        },
        resetWorldRotation: function(){
            this.worldgroup.pivot.x = this.world.width / 2;
            this.worldgroup.pivot.y = this.world.height / 2;
            this.worldgroup.x = this.worldgroup.pivot.x;
            this.worldgroup.y = this.worldgroup.pivot.y;
        },
        resetPlayerPosition: function(){
            this.player.kill();
            this.ground.kill();
            this.stars.forEachExists(function(i){i.kill();}, true);

            this.ground = this.platforms.create(screenWidth/2, screenHeight, 'ground');
            this.ground.scale.setTo(2, 1);
            this.ground.anchor.set(.5);
            this.game.physics.arcade.enable(this.ground);
            this.ground.body.immovable = true;

            this.player = this.createPlayer();

            if (this.flipState){
                this.starTimer.pause();
            } else {
                this.starTimer.resume();
            }

            this.flipState = !this.flipState;
        }

    }


    var game = new Phaser.Game(screenWidth, screenHeight, Phaser.AUTO, 'game');
    game.state.add('start', StartState);
    game.state.add('game', GameState);
    game.state.start('start');
}