// start slingin' some d3 here.

var gameOptions = {
  height: 450,
  width: 700,
  nEnemies: 30,
  padding: 20
};

var gameStats = {
  score: 0,
  bestScore: 0
};

var axes = {
  x: d3.scale.linear().domain([0,gameOptions.width]).range([0,300]),
  y: d3.scale.linear().domain([0,gameOptions.height]).range([0,300])
};

var gameBoard = d3.select('body').append('svg')
                    .attr('width', gameOptions.width)
                    .attr('height', gameOptions.height);

var map = d3.select('body').append('svg')
                    .attr('width', 300)
                    .attr('height', 300);

var updateScore = function(){
  d3.select('.current span')
      .text(gameStats.score.toString());
};

var updateBestScore = function(){
  if(gameStats.score > gameStats.bestScore){
    gameStats.bestScore = gameStats.score;
  }

  d3.select('.high span')
      .text(gameStats.bestScore.toString());
};

var Player = function(){
  this.fill = '#ff0000';
  this.x = 0;
  this.y = 0;
  this.r = 5;
};

Player.prototype.render = function(board) {
  this.el = board.append('circle')
    .attr('r', this.r)
    .attr('x', this.x)
    .attr('y', this.y)
    .attr('fill', this.fill);
  
  this.transform({x: gameOptions.width * 0.5, y: gameOptions.height * 0.5 });

  this.setupDragging();
  return this;
};

Player.prototype.getX = function(){
  return this.x;
};

Player.prototype.setX = function(x){
  var minX = gameOptions.padding;
  var maxX = gameOptions.width - gameOptions.padding;
  
  if(x <= minX){
    x = minX;
  };

  if(x >= maxX){
    x = maxX;
  };

  this.x = x;
};

Player.prototype.getY = function(){
  return this.y;
};

Player.prototype.setY = function(y){
  var minY = gameOptions.padding;
  var maxY = gameOptions.height - gameOptions.padding;
  
  if(y <= minY){
    y = minY;
  };

  if(y >= maxY){
    y = maxY;
  };

  this.y = y;
};

Player.prototype.transform = function(options){
  this.setX(options.x || this.x);
  this.setY(options.y || this.y);

  this.el.attr('transform', "translate(" + this.getX() + "," + this.getY() + ")");
};

Player.prototype.moveAbsolute = function(x,y){
  this.transform({x: x, y: y});
};

Player.prototype.moveRelative = function(dx, dy){
  this.transform({x: this.getX() + dx, y: this.getY() + dy});
};

Player.prototype.setupDragging = function(){
  var context = this;
  var dragMove = function(){
    findFriend();
    context.moveRelative(d3.event.dx, d3.event.dy);
  };

  var drag = d3.behavior.drag()
              .on('drag', dragMove);

  this.el.call(drag);
};

var player = new Player().render(gameBoard);

var createEnemies = function() {
  var enemies = [];
  for (var i = 0; i < gameOptions.nEnemies; i++) {
    enemies.push({
      id: i,
      x: Math.random()*gameOptions.width,
      y: Math.random()*gameOptions.height,
      rotation: 0
    });
  }
  return enemies;
};

var render = function(enemy_data) {
  var enemies = gameBoard.selectAll('image.enemy')
                  .data(enemy_data, function(d) { return d.id });

  enemies.enter()
    .append('image')
      .attr('class', 'enemy')
      .attr('x', function(enemy) { return enemy.x })
      .attr('y', function(enemy) { return enemy.y })
      .attr('width', 0)
      .attr('height', 0)
      .attr('xlink:href', 'shuriken.png');

  enemies.exit()
    .remove();

  var checkCollision = function(enemy, collidedCallback) {
    var radiusSum = parseFloat(enemy.attr('width') / 2) + player.r;
    var xDiff = parseFloat(enemy.attr('x')) - player.x;
    var yDiff = parseFloat(enemy.attr('y')) - player.y;

    if ( (Math.sqrt( Math.pow(xDiff,2) + Math.pow(yDiff,2) ) < radiusSum) ) {
      collidedCallback(player, enemy);
      map.append('circle')
        .attr('fill', 'black')
        .attr('cx', axes.x(player.x))
        .attr('cy', axes.y(player.y))
        .attr('r', 2)
    }
  }

  var onCollision = function() {
    updateBestScore();
    gameStats.score = 0;
    updateScore();
  }

  var tweenWithCollisionDetection = function(endData){
    var enemy = d3.select(this);
    
    var startPos = {
      x: parseFloat(enemy.attr('x')),
      y: parseFloat(enemy.attr('y'))
    };

    var endPos = {
      x: endData.x,
      y: endData.y
    };

    return function(t){
      checkCollision(enemy, onCollision);

      var enemyNextPos = {
        x: startPos.x + (endPos.x - startPos.x) * t,
        y: startPos.y + (endPos.y - startPos.y) * t
      }

      enemy.attr('x', enemyNextPos.x)
            .attr('y', enemyNextPos.y);
    }
  };

  enemies
    .transition()
      .duration(1000)
      .attr('width', 30)
      .attr('height', 30)
    .transition()
      .duration(2000)
      .tween('custom', tweenWithCollisionDetection);
};

var createFriend = function(){
  var friend = [{
    x: Math.random() * (gameOptions.width - gameOptions.padding * 2) + gameOptions.padding,
    y: Math.random() * (gameOptions.height - gameOptions.padding * 2) + gameOptions.padding
  }];
  return friend;
}

var newFriend = createFriend();

var renderFriend = function(){
  gameBoard.selectAll('.friend')
    .data(newFriend)
    .enter()
    .append('circle')
      .attr('class', 'friend')
      .attr('cx', function(d){return d.x})
      .attr('cy', function(d){return d.y})
      .attr('r', 5)
      .attr('fill', 'green');
}

var findFriend = function() {
  var friend = gameBoard.selectAll('.friend');
  var radiusSum = 10;
  var xDiff = parseFloat(friend.attr('cx')) - player.x;
  var yDiff = parseFloat(friend.attr('cy')) - player.y;

  if ( (Math.sqrt( Math.pow(xDiff,2) + Math.pow(yDiff,2) ) < radiusSum) ) {
    gameBoard.selectAll('.friend')
      .attr('cx', Math.random() * (gameOptions.width - gameOptions.padding * 2) + gameOptions.padding)
      .attr('cy', Math.random() * (gameOptions.height - gameOptions.padding * 2) + gameOptions.padding)
  }
}

var play = function(){
  var gameTurn = function(){
    var newEnemyPositions = createEnemies();
    render(newEnemyPositions);
  };

  var increaseScore = function(){
    gameStats.score++;
    updateScore();
  };

  gameTurn();
  renderFriend();
  setInterval(gameTurn, 2000);
  setInterval(increaseScore, 50);
};

play();

