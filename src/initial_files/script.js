var canvas = document.getElementById("myCanvas");
var context = canvas.getContext("2d");
context.fillStyle = "#FF0000";

// hero
var heroSize = 5;
var heroPosition = { x: 50, y: 50 };

// physics
var gravity = 2;

// this runs 60 times per second
window.setInterval(function() {
  context.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  heroPosition.y = Math.min(
    canvas.height - heroSize,
    heroPosition.y + gravity
  );

  context.fillRect(
    heroPosition.x,
    heroPosition.y,
    heroSize,
    heroSize
  );
}, 1000 / 60);
