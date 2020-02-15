const directions = ['q', 'w', 'e', 'a', 's', 'd'];
const opposite_directions = {'q': 'd', 'w': 's', 'e': 'a', 'a': 'e', 's': 'w', 'd': 'q'};
const adjacent_directions = {'q': ['a', 'w'], 'w': ['q', 'e'], 'e': ['w', 'd'], 'a': ['s', 'q'], 's': ['a', 'd'], 'd': ['e', 's']};
let endingModalDisplay;

const CANVAS_SIZE = 600;
const SHIFT_X = 45, SHIFT_Y = 60;

window.onload = function() {
  class HexBlock {
    constructor() {
      this.value = null;
      this.blocks = {};
      for (let i = 0; i < 6; i++) {
        this.blocks[directions[i]] = null;
      }
    }
    toString () {
      return this.value;
    }
  }
  class HexGrid {
    constructor () {
      this.setUpGrid();
      this.connectBlocks();
      this.setUpLandingPoints();
    }

    serialize () {
      var str = "";
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < this.grid[i].length; j++) {
          str += " " + this.grid[i][j].value;
        }
      }
      return str;
    }

    loadFromMemory () {
      if ("grid" in localStorage) {
        this.loadFromString(localStorage["grid"]);
      }
    }

    loadFromString (string) {
      var data = string.split(" ").reverse();
      data.pop();
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < this.grid[i].length; j++) {
          let next = data.pop();
          if (next == "null") {
            this.grid[i][j].value = null;
          } else {
            this.grid[i][j].value = parseInt(next);
          }
        }
      }
    }

    toString () {
      var str = "";
      for (let i = 0; i < 5; i++) {
        str += "|"
        for (let j = 0; j < this.grid[i].length; j++) {
          str += " " + this.grid[i][j].value;
        }
        str += "\n";
      }
      return str;
    }

    addRandomBlock () {
      var freeBlocks = []

      for (let i = 0; i < this.grid.length; i++) {
        for (let j = 0; j < this.grid[i].length; j++) {
          if (this.grid[i][j].value == null) {
            freeBlocks.push(this.grid[i][j]);
          }
        }
      }

      if (freeBlocks.length > 0) {
        var block = freeBlocks[parseInt(Math.random() * freeBlocks.length)];
        var value = [2, 4][parseInt(Math.random() * 2)];
        block.value = value;
      }
    }

    _shiftTowards_storeValues (opp_dir, node) {
      var i = node;
      var values = [];
      while (i != null) {
        if (i.value != null) {
          values.push(i.value);
        }
        i = i.blocks[opp_dir];
      }
      return values;
    }

    _shiftTowards_condenseValues (values) {
      var final_values = [];
      var i = 0;
      while (i < values.length) {
        if (i + 1 == values.length) {
          final_values.push(values[i]);
        } else {
          if (values[i] != values[i + 1]) {
            final_values.push(values[i]);
          } else {
            final_values.push(values[i] * 2);
            i++;
          }
        }
        i++;
      }
      return final_values;
    }

    _shiftTowards_updateValues (final_values, opp_dir, node) {
      final_values.reverse();
      var i = node;
      while (i != null) {
        if (final_values.length != 0) {
          i.value = final_values.pop();
        } else {
          i.value = null;
        }
        i = i.blocks[opp_dir];
      }
    }

    shiftTowards(direction) {
      var landing_points = this.landing_points[direction];
      var opp_dir = opposite_directions[direction];

      for (let i = 0; i < landing_points.length; i++) {
        var node = landing_points[i];
        var values = this._shiftTowards_storeValues(opp_dir, node);
        var final_values = this._shiftTowards_condenseValues(values);
        this._shiftTowards_updateValues(final_values, opp_dir, node);
      }
    }

    setUpGrid() {
      this.grid = [];
      for (let i = 0; i < 5; i++) {
        this.grid.push([]);
      }
      // generate blocks
      for (let i = 0; i < 3; i++) {
        this.grid[0].push(new HexBlock());
      }
      for (let i = 0; i < 4; i++) {
        this.grid[1].push(new HexBlock());
      }
      for (let i = 0; i < 5; i++) {
        this.grid[2].push(new HexBlock());
      }
      for (let i = 0; i < 4; i++) {
        this.grid[3].push(new HexBlock());
      }
      for (let i = 0; i < 3; i++) {
        this.grid[4].push(new HexBlock());
      }

    }

    connectBlocks() {
      // connect horizontally
      for (let j = 0; j < 5; j++) {
        for (let i = 0; i < this.grid[j].length - 1; i++) {
          this.grid[j][i].blocks['e'] = this.grid[j][i + 1];
          this.grid[j][i + 1].blocks['a'] = this.grid[j][i];
        }
      }

      // connect different rows
      for (let j = 0; j < 2; j++) {
        for (let i = 0; i < this.grid[j].length; i++) {

          this.grid[j][i].blocks['s'] = this.grid[j + 1][i];
          this.grid[j + 1][i].blocks['w'] = this.grid[j][i];

          this.grid[j][i].blocks['d'] = this.grid[j + 1][i + 1];
          this.grid[j + 1][i + 1].blocks['q'] = this.grid[j][i];
        }
      }

      for (let k = 0; k < 2; k++) {
        var j = 4 - k;
        for (let i = 0; i < this.grid[j].length; i++) {

          this.grid[j][i].blocks['q'] = this.grid[j - 1][i];
          this.grid[j - 1][i].blocks['d'] = this.grid[j][i];

          this.grid[j][i].blocks['w'] = this.grid[j - 1][i + 1];
          this.grid[j - 1][i + 1].blocks['s'] = this.grid[j][i];
        }
      }
    }

    setUpLandingPoints() {
      // set up gravity landing points
      this.landing_points = {}
      this.landing_points['q'] = [this.grid[0][0], this.grid[0][1], this.grid[0][2], this.grid[1][0], this.grid[2][0]];
      this.landing_points['w'] = [this.grid[0][0], this.grid[0][1], this.grid[0][2], this.grid[1][3], this.grid[2][4]];
      this.landing_points['e'] = [this.grid[0][2], this.grid[1][3], this.grid[2][4], this.grid[3][3], this.grid[4][2]];
      this.landing_points['a'] = [this.grid[0][0], this.grid[1][0], this.grid[2][0], this.grid[3][0], this.grid[4][0]];
      this.landing_points['s'] = [this.grid[2][0], this.grid[3][0], this.grid[4][0], this.grid[4][1], this.grid[4][2]];
      this.landing_points['d'] = [this.grid[2][4], this.grid[3][3], this.grid[4][0], this.grid[4][1], this.grid[4][2]];
    }
  }
  game = new Phaser.Game(CANVAS_SIZE + 2 * SHIFT_X, CANVAS_SIZE + 2 * SHIFT_Y + 100, Phaser.AUTO, 'game-canvas', { preload: preload, create: create, update: update });

  function preload () {
      game.load.image('hexgridSprite', 'hexgrid2.png');
      game.load.image('movement_instructions', 'movement_example.png');
      game.load.image('movementKeysSprite', 'keys.png');
  }

  function keyDown() {
    return keys['q'].isDown || keys['w'].isDown || keys['e'].isDown ||
      keys['a'].isDown || keys['s'].isDown || keys['d'].isDown;
  }

  function directionPressed() {
    for (let i = 0; i < directions.length; i++) {
      if (keys[directions[i]].isDown) {
        return directions[i];
      }
    }
  }

  function setUpKeys() {
    keys = {};
    keys['q'] = game.input.keyboard.addKey(Phaser.Keyboard.Q);
    keys['w'] = game.input.keyboard.addKey(Phaser.Keyboard.W);
    keys['e'] = game.input.keyboard.addKey(Phaser.Keyboard.E);
    keys['a'] = game.input.keyboard.addKey(Phaser.Keyboard.A);
    keys['s'] = game.input.keyboard.addKey(Phaser.Keyboard.S);
    keys['d'] = game.input.keyboard.addKey(Phaser.Keyboard.D);
    enterKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    pressEnabled = true;
  }

  function setUpTiles() {
    tiles = [];
  }

  function addRandomBlock() {
    grid.addRandomBlock();
  }

  function setUpGrid() {
    grid = new HexGrid();
    if ("grid" in localStorage) {
      grid.loadFromMemory();
    } else {
      addRandomBlock();
      addRandomBlock();
    }
  }

  function setUpDisplay() {
    gameDisplay = game.add.group();
    game.stage.backgroundColor = "#000000";
    valueSizes = {
      2: 48,
      4: 48,
      8: 48,
      16: 48,
      32: 48,
      64: 48,
      128: 48,
      256: 40,
      512: 40,
      1024: 32,
      2048: 32,
      4096: 32,
      8192: 32,
      16384: 32,
      32768: 32,
      65536: 32,
      131072: 28,
      262144: 28,
      524288: 28,
      1048576: 24,
    };
    valueColors = {
      2: "fff",
      4: "add",
      8: "5bb",
      16: "ed717c",
      32: "db6fdb",
      64: "f99",
      128: "9f9",
      256: "10c5ee",
      512: "c5ee10",
      1024: "1eb",
      2048: "ff9",
      4096: "eea",
      8192: "ddc",
      16384: "cce",
      32768: "55f",
      65536: 'fff',
      131072: 'fff',
      262144: 'fff',
      524288: 'fff',
      1048576: 'fff',
    };
    starterPositions = [[124, 192], [124, 300], [124, 408], [214, 462], [304, 516]];
    for (let i = 0; i < starterPositions.length; i++) {
      starterPositions[i][0] += SHIFT_X;
      starterPositions[i][1] += SHIFT_Y;
    }

    const hexgridSprite = game.add.sprite(0, 30 + 100, 'hexgridSprite');
    gameDisplay.add(hexgridSprite);
  }

  function displayInstructionsModal(initialRender) {
    if (this.displayingEnding || initialRender) {
      if (endingModalDisplay) endingModalDisplay.destroy();
      instructionsDisplay = game.add.group();
      var bar = game.add.graphics();

      bar.beginFill(0x222222, 0.95);
      bar.lineStyle(5, 0x3966cb, 1);
      bar.drawRoundedRect(SHIFT_X + 20, 0, game.width - 40 - 2 * SHIFT_X, 100);
      instructionsDisplay.add(bar);

      var style = { font: "28px upheaval", fill: "#fff", boundsAlignH: "left", boundsAlignV: "top", wordWrap: true, wordWrapWidth: game.width - 100 };
      var text = game.add.text(SHIFT_X, SHIFT_Y,
        'Use the                  keys to shift tiles.\n\n', style);
      text.setTextBounds(40, -26, game.width, 160);
      instructionsDisplay.add(text);

      style = { font: "18px upheaval", fill: "#fff", boundsAlignH: "center", textAlign: "center", wordWrap: true, wordWrapWidth: game.width - 100 };
      const movementKeysSprite = game.add.sprite(202, 18, 'movementKeysSprite');
      instructionsDisplay.add(movementKeysSprite);
      this.displayingEnding = false;
    }
  }

  function create () {
    setUpKeys();
    setUpTiles();
    setUpGrid();
    setUpDisplay();
    displayInstructionsModal(true);
    gameEnded = false;
    game.input.onTap.add(onTap, this);
    game.stage.backgroundColor = "#f5f5dc";
  }

  function moveTowards (direction) {
    console.log("moveTowards " + direction)
    var oldGrid = grid.toString();
    grid.shiftTowards(direction);
    if (oldGrid != grid.toString()) {
      addRandomBlock();
      addRandomBlock();
    }
    if (unableToMove()) {
      gameEnded = true;
    } else {
      localStorage.setItem("grid", "" + grid.serialize())
    }
  }

  function onTap (pointer, doubletap) {
    if (typeof instructionsDisplay != "undefined" && instructionsDisplay.parent != null) {
      instructionsDisplay.destroy(true);
    } else {
      if (pointer.x < 220 && pointer.y < 370) {
        moveTowards("q");
      } else if (pointer.x > 220 && pointer.x < 470 && pointer.y < 285) {
        moveTowards("w");
      } else if (pointer.x > 470 && pointer.y < 370) {
        moveTowards("e");
      } else if (pointer.x < 220 && pointer.y > 370) {
        moveTowards("a");
      } else if (pointer.x > 220 && pointer.x < 470 && pointer.y > 435) {
        moveTowards("s");
      } else if (pointer.x > 470 && pointer.y > 370) {
        moveTowards("d");
      }
    }
  }



  function clearOldTiles() {
    while (tiles.length > 0) {
      tiles.pop().destroy();
    }
  }

  function generateNewTiles() {
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < grid.grid[i].length; j++) {
        if (grid.grid[i][j].value != null) {
          let text = game.add.text(
            starterPositions[i][0] + 90 * j,
            starterPositions[i][1] - 54 * j + 100,
            grid.grid[i][j].value,
            {
              font: valueSizes[grid.grid[i][j].value] + "px upheaval",
              fill: "#" + valueColors[grid.grid[i][j].value],
              boundsAlignH: "center",
              boundsAlignV: "middle"
            },
          );
          text.setTextBounds(-50, -50, 100, 100);
          tiles.push(text);
          gameDisplay.add(text);
        }
      }
    }

  }

  function unableToMove() {
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < grid.grid[i].length; j++) {
        if (grid.grid[i][j].blocks["e"] != null && (grid.grid[i][j].blocks["e"].value == null || grid.grid[i][j].blocks["e"].value == grid.grid[i][j].value)
            || grid.grid[i][j].blocks["s"] != null && (grid.grid[i][j].blocks["s"].value == null || grid.grid[i][j].blocks["s"].value == grid.grid[i][j].value)
            || grid.grid[i][j].blocks["d"] != null && (grid.grid[i][j].blocks["d"].value == null || grid.grid[i][j].blocks["d"].value == grid.grid[i][j].value)
          ) {
              return false;
        }
      }
    }
    return true;
  }

  displayingEnding = false;
  function displayGameOverModal() {
    if (!this.displayingEnding) {
      instructionsDisplay.destroy();
      endingModalDisplay = game.add.group();
      endingBar = game.add.graphics();
      endingBar.beginFill(0x222222, 1);
      endingBar.lineStyle(5, 0xffffff, 1);
      endingBar.drawRoundedRect(20, 0, game.width - 40, 100);
      endingModalDisplay.add(endingBar);

      var style = { font: "28px upheaval", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle", wordWrap: true, wordWrapWidth: game.width - 100 };
      var text = game.add.text(0, 0, "No more valid moves...", style);
      text.setTextBounds(0, -40, game.width, 160);
      endingModalDisplay.add(text);

      style = { font: "20px upheaval", fill: "#fff", boundsAlignH: "center", textAlign: "center", wordWrap: true, wordWrapWidth: game.width - 100 };
      text = game.add.text(0, 0, "Press enter to try again.", style);
      text.setTextBounds(0, 56, game.width, 250);
      endingModalDisplay.add(text);
      this.displayingEnding = true;
    }
  }

  function processUserInput() {
    if (!gameEnded) {
      displayInstructionsModal();
      if (pressEnabled){
        if (keyDown()) {
          pressEnabled = false;
          var oldGrid = grid.toString();
          grid.shiftTowards(directionPressed());
          if (oldGrid != grid.toString()) {
            addRandomBlock();
            addRandomBlock();
          }
          if (unableToMove()) {
            console.log('can no longer move');
            gameEnded = true;
          } else {
            localStorage.setItem("grid", "" + grid.serialize())
          }
        }
      } else if (!keyDown()) {
        pressEnabled = true;
      }
    } else {
      displayGameOverModal();
      if (enterKey.isDown) {
        endingModalDisplay.destroy();
        endingBar.destroy();
        localStorage.clear();
        setUpGrid();
        gameEnded = false;
        game.world.bringToTop(gameDisplay);
      }
    }
  }

  function update() {
    clearOldTiles();
    generateNewTiles();
    processUserInput();
  }
};
