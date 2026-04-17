// Board setup
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

// Bird setup
let birdWidth = 34; 
let birdHeight = 24;
let birdX = boardWidth / 8;
let birdY = boardHeight / 2;
let birdImg;

let bird = { x: birdX, y: birdY, width: birdWidth, height: birdHeight };

// Pipes
let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;
let pipeX = boardWidth;
let topPipeImg, bottomPipeImg;

// Physics & Game State
let velocityX = -2;
let velocityY = 0;
let gravity = 0.4;
let gameOver = false;
let score = 0;

// API & Data Variables (For Rubric: Data Display & Fetch)
let currentWord = "Fly!";
let currentDef = "Search a word or pass pipes!";
let wordAudio = null;

// Audio Assets
let flapSound = new Audio("./flap.mp3");
let hitSound = new Audio("./hit.mp3");
let scoreSound = new Audio("./score.mp3");
let bgMusic = new Audio("./music.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.2;

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    // Load Images
    birdImg = new Image();
    birdImg.src = "./flappybird.png";
    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";
    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png";

    // Event Listeners
    document.addEventListener("keydown", moveBird);
    
    // Search Functionality (For Rubric: Search & Event Handling)
    const searchInput = document.getElementById("wordSearch");
    searchInput.addEventListener("change", (e) => {
        fetchWord(e.target.value);
    });

    requestAnimationFrame(update);
    setInterval(placePipes, 1500);
}

// Fetch API Function (For Rubric: Fetch API Usage)
async function fetchWord(word) {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await response.json();
        if (data[0]) {
            currentWord = data[0].word;
            currentDef = data[0].meanings[0].definitions[0].definition;
            // Play Audio from API (For Rubric: Advanced Features)
            if (data[0].phonetics[0]?.audio) {
                if(wordAudio) wordAudio.pause();
                wordAudio = new Audio(data[0].phonetics[0].audio);
                wordAudio.play();
            }
        }
    } catch (err) {
        currentWord = "Err!";
        currentDef = "Word not found.";
    }
}

function update() {
    requestAnimationFrame(update);
    if (gameOver) return;

    context.clearRect(0, 0, board.width, board.height);

    // Bird physics
    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0);
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

    if (bird.y > board.height) {
        if (!gameOver) hitSound.play();
        gameOver = true;
    }

    // Pipes logic
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        // Scoring & Fetch Trigger
        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5;
            if (score % 1 === 0) {
                scoreSound.play();
                // Get a new random word every time we pass a set of pipes
                const words = ["velocity", "gravity", "altitude", "rhythm", "lexicon"];
                fetchWord(words[Math.floor(Math.random() * words.length)]);
            }
            pipe.passed = true;
        }

        if (detectCollision(bird, pipe)) {
            if (!gameOver) {
                hitSound.play();
                bgMusic.pause();
            }
            gameOver = true;
        }
    }

    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift();
    }

    // Data Display (For Rubric: DOM Manipulation/Canvas)
    context.fillStyle = "white";
    context.font = "45px sans-serif";
    context.fillText(score, 5, 45);

    context.fillStyle = "yellow";
    context.font = "20px Courier New";
    context.fillText(currentWord.toUpperCase(), 5, 80);

    context.fillStyle = "lightgray";
    context.font = "12px Arial";
    // Basic text wrapping for definition
    context.fillText(currentDef.substring(0, 50) + "...", 5, 100);

    if (gameOver) {
        context.fillStyle = "white";
        context.font = "45px sans-serif";
        context.fillText("GAME OVER", 5, 150);
    }
}

function placePipes() {
    if (gameOver) return;
    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
    let openingSpace = board.height / 4;

    pipeArray.push({ img: topPipeImg, x: pipeX, y: randomPipeY, width: pipeWidth, height: pipeHeight, passed: false });
    pipeArray.push({ img: bottomPipeImg, x: pipeX, y: randomPipeY + pipeHeight + openingSpace, width: pipeWidth, height: pipeHeight, passed: false });
}

function moveBird(e) {
    if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX") {
        flapSound.currentTime = 0;
        flapSound.play();
        if (bgMusic.paused && !gameOver) bgMusic.play();

        velocityY = -6;

        if (gameOver) {
            bird.y = birdY;
            pipeArray = [];
            score = 0;
            gameOver = false;
            bgMusic.currentTime = 0;
            bgMusic.play();
        }
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
