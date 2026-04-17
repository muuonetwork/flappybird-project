// Board and Game Variables
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

// Bird Setup
let birdWidth = 34; 
let birdHeight = 24;
let birdX = boardWidth / 8;
let birdY = boardHeight / 2;
let birdImg;
let bird = { x: birdX, y: birdY, width: birdWidth, height: birdHeight };

// Pipe Setup
let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;
let pipeX = boardWidth;
let topPipeImg, bottomPipeImg;

// Physics
let velocityX = -2; 
let velocityY = 0; 
let gravity = 0.4;
let gameOver = false;
let score = 0;

// Rubric Variables: Data & Audio
let currentWord = "FLAPPY";
let currentDefinition = "Search a word or pass pipes!";
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
    
    // Rubric: Form Handling & Search
    const searchBar = document.getElementById("wordSearch");
    searchBar.addEventListener("change", (e) => {
        fetchDictionaryData(e.target.value);
    });

    requestAnimationFrame(update);
    setInterval(placePipes, 1500);
}

// Rubric: Fetch API Usage
async function fetchDictionaryData(word) {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await response.json();
        
        if (data[0]) {
            currentWord = data[0].word.toUpperCase();
            currentDefinition = data[0].meanings[0].definitions[0].definition;
            
            // Rubric: Advanced Feature - Dictionary Audio
            if (data[0].phonetics[0]?.audio) {
                if(wordAudio) wordAudio.pause();
                wordAudio = new Audio(data[0].phonetics[0].audio);
                wordAudio.play();
            }
        }
    } catch (error) {
        currentWord = "OOPS!";
        currentDefinition = "Word not found in dictionary.";
    }
}

function update() {
    requestAnimationFrame(update);
    if (gameOver) return;
    context.clearRect(0, 0, board.width, board.height);

    // Bird Physics
    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0);
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

    if (bird.y > board.height) {
        gameOver = true;
    }

    // Pipe Logic
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        // Scoring and Triggering New Word
        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5;
            if (score % 1 === 0) {
                scoreSound.play();
                // Fetch a random educational word every point
                const gameWords = ["velocity", "gravity", "algorithm", "binary", "canvas"];
                fetchDictionaryData(gameWords[Math.floor(Math.random() * gameWords.length)]);
            }
            pipe.passed = true;
        }

        if (detectCollision(bird, pipe)) {
            hitSound.play();
            bgMusic.pause();
            gameOver = true;
        }
    }

    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift();
    }

    // Rubric: Data Display (Definitions on screen)
    context.fillStyle = "white";
    context.font = "45px sans-serif";
    context.fillText(score, 5, 45);

    context.fillStyle = "yellow";
    context.font = "bold 20px Arial";
    context.fillText(currentWord, 5, 85);

    context.fillStyle = "lightgray";
    context.font = "14px Arial";
    // Truncate long definitions to fit the screen
    let displayDef = currentDefinition.length > 50 ? currentDefinition.substring(0, 47) + "..." : currentDefinition;
    context.fillText(displayDef, 5, 110);

    if (gameOver) {
        context.fillStyle = "red";
        context.font = "45px sans-serif";
        context.fillText("GAME OVER", 5, 200);
        context.font = "20px sans-serif";
        context.fillText("Press Space to Restart", 5, 240);
    }
}

function placePipes() {
    if (gameOver) return;
    let randomPipeY = -pipeHeight/4 - Math.random()*(pipeHeight/2);
    let openingSpace = board.height / 4;

    pipeArray.push({ img: topPipeImg, x: pipeX, y: randomPipeY, width: pipeWidth, height: pipeHeight, passed: false });
    pipeArray.push({ img: bottomPipeImg, x: pipeX, y: randomPipeY + pipeHeight + openingSpace, width: pipeWidth, height: pipeHeight, passed: false });
}

function moveBird(e) {
    if (e.code == "Space" || e.code == "ArrowUp") {
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