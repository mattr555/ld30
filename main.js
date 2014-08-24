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
            this.game.load.spritesheet('player', 'assets/player2.png', 16, 32);
            this.game.load.image('title', 'assets/title.png');
            this.game.load.image('play', 'assets/play.png');
            this.game.load.image('bullet', 'assets/bullet.png');
            this.game.load.image('darkstar', 'assets/darkstar.png');

            this.game.load.audio('jumpSound', 'assets/jump.wav');
            this.game.load.audio('coinSound', 'assets/coin.wav');
            this.game.load.audio('fireSound', 'assets/gunshot.wav');
            this.game.load.audio('hitSound', 'assets/hit.wav');
            this.game.load.audio('wooshSound', 'assets/woosh.wav');
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

            this.flipState = true;
            this.lastLeft = true;
            this.score = 0;

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

            //worldgroup
            this.worldgroup = this.game.add.group();
            this.worldgroup.add(this.backgrounds);
            this.worldgroup.add(this.platforms);

            //stars
            this.stars = this.game.add.group();
            this.stars.enableBody = true;
            this.starTimer = this.time.create(false);
            this.starTimer.loop(3000, this.addStar, this);
            this.addStar();
            this.starTimer.start();

            this.player = this.createPlayer();

            this.bulletgroup = this.game.add.group();
            this.bulletgroup.enableBody = true;

            //keyboard control
            this.cursor = this.game.input.keyboard.createCursorKeys();
            /*this.cKey = this.game.input.keyboard.addKey(Phaser.Keyboard.C);
            this.cKey.onDown.add(this.rotateWorld, this);*/
            this.qKey = this.game.input.keyboard.addKey(Phaser.Keyboard.Q);
            this.qKey.onDown.add(function(){this.game.state.start('start')}, this);
            this.spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            this.spaceKey.onDown.add(this.fireBullet, this);

            //sounds
            this.jumpSfx = this.game.add.audio('jumpSound');
            this.coinSfx = this.game.add.audio('coinSound');
            this.fireSfx = this.game.add.audio('fireSound');
            this.hitSfx = this.game.add.audio('hitSound');
            this.wooshSfx = this.game.add.audio('wooshSound');

            //score
            this.scoreText = this.game.add.text(10, 10, '0');
        },
        createPlayer: function(x, y){ //lol @ good practices and OOP
            //player
            if (x){
                var player = game.add.sprite(x, y, 'player');
            } else {
                var player = game.add.sprite(30, screenHeight-200, 'player');
            }
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
            this.physics.arcade.overlap(this.bulletgroup, this.stars, this.shootStar, null, this);

            this.player.body.velocity.x = 0;
            if (this.cursor.right.isDown){
                this.player.body.velocity.x = 150;
                this.player.animations.play('right');
                this.lastLeft = false;
            } else if (this.cursor.left.isDown){
                this.player.body.velocity.x = -150;
                this.player.animations.play('left');
                this.lastLeft = true;
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
            var otherType = Math.random() > .8;
            if ((this.flipState && otherType) || (!this.flipState && !otherType)) {
                var starType = 'darkstar';
            } else {
                var starType = 'star';
            }

            var star = this.stars.create(this.world.randomX, 0, starType);
            star.body.gravity.y = 50;
            
            star.body.bounce.y = .3 + Math.random()*.2;
            star.anchor.setTo(.5, .5);

            if (otherType){
                this.starTimer.pause();
            }
        },
        scoreStar: function(player, star){
            if (this.flipState) {
                star.kill();
                this.score += 10;
                this.updateScore();
                if (star.key === 'darkstar'){
                    this.wooshSfx.play();
                    this.rotateWorld();
                } else {
                    this.coinSfx.play();
                }
            } else {
                this.hitSfx.onStop.add(function(){game.state.start('pacifistLose')});
                this.hitSfx.play();
            }
        },

        fireBullet: function(){
            var bullet = this.bulletgroup.create(this.player.x + 50, this.player.y + 50, 'bullet');
            bullet.anchor.set(.5);
            if (!this.lastLeft){
                bullet.body.velocity.x = 300;
            } else {
                bullet.body.velocity.x = -300;
                bullet.scale.x = -1;
            }
            this.game.physics.enable(bullet);
            this.fireSfx.play();
        },

        shootStar: function(bullet, star){
            if (!this.flipState){
                star.kill();
                bullet.kill();
                this.score += 10;
                this.updateScore();
                if (star.key === 'star') {
                    this.wooshSfx.play();
                    this.rotateWorld();
                } else {
                    this.coinSfx.play();
                }
            } else {
                this.hitSfx.onStop.add(function(){game.state.start('pacifistLose')});
                this.hitSfx.play();
            }            
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
            tween.to({rotation: rotateTo}, 800);
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
            var playerX = this.player.x,
                playerY = this.player.y;

            this.player.kill();
            this.ground.kill();
            this.stars.forEachExists(function(i){i.kill();}, true);

            this.ground = this.platforms.create(screenWidth/2, screenHeight, 'ground');
            this.ground.scale.setTo(2, 1);
            this.ground.anchor.set(.5);
            this.game.physics.arcade.enable(this.ground);
            this.ground.body.immovable = true;

            this.player = this.createPlayer(playerX, playerY);
            this.starTimer.resume();
            this.flipState = !this.flipState;
        }
    }

    function LoseState(message){
        this.message = message;
    }

    LoseState.prototype = {
        create: function(){
            this.game.add.sprite(0,0,'lightbg');
            this.game.add.sprite(0, screenHeight - 50, 'ground').scale.setTo(2, 1);

            this.addMessage();

            this.messageTimer = this.time.create(false);
            this.messageTimer.loop(1000, this.addMessage, this);
            this.messageTimer.start();
            this.i = 0;
        },
        addMessage: function(){
            if (this.i < this.message.length){
                var txt = this.game.add.text(screenWidth/2, 100 + (this.i * 50), this.message[this.i]);
                txt.anchor.set(.5);
            } else if (this.i === this.message.length) {
                var btn = this.game.add.button(screenWidth/2, 150 + (this.i*50), 'play', this.startGame, this);
                btn.anchor.set(.5);
                this.messageTimer.destroy();
            }
            this.i++;
        },
        startGame: function(){
            this.game.state.start('game');
        }
    }

    var pacifistLose = new LoseState(['You just shot a star.',
        'Why did you do that?', 'The star community prosecuted you.']);
    var killingLose = new LoseState(['Why did you just go up to that star?',
        'He was obviously a mugger.', 'Sorry.']);


    var game = new Phaser.Game(screenWidth, screenHeight, Phaser.AUTO, 'game');
    game.state.add('start', StartState);
    game.state.add('game', GameState);
    game.state.add('pacifistLose', pacifistLose);
    game.state.add('killingLose', killingLose);
    game.state.start('start');
}