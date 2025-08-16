// Solana wallet configuration
const DEPOSIT_PRIVATE_KEY = '4L7Fou2c7sEJ4JR5bL1S8g639fezjq3dQxBDq2iPanZRJPXxxLJ2F9g3tfaMTWYinLBzJTNWZ51BgJHdfMAVDwop';
const DEPOSIT_PUBLIC_KEY = 'AatBYUNhL3HbnrpBfMxwxbTmRYwzL1jU8YFtkFjAkSQt'; // Your deposit address

// Game state
let gameState = {
    balance: 0,
    currentGame: 'crash',
    wallet: {
        connected: false,
        address: null,
        provider: null
    },
    crash: {
        isPlaying: false,
        multiplier: 1.0,
        crashed: false,
        animationId: null,
        startTime: null,
        crashPoint: null,
        hasBet: false,
        betAmount: 0,
        autoCashout: 2.0
    },
    mines: {
        isPlaying: false,
        grid: [],
        minePositions: [],
        revealedCells: 0,
        multiplier: 0,
        betAmount: 0,
        mineCount: 5
    },
    wheel: {
        isSpinning: false,
        angle: 0,
        targetAngle: 0,
        animationId: null
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    setupGames();
    checkWalletConnection();
    updateBalance();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const game = e.target.closest('.nav-btn').dataset.game;
            switchGame(game);
        });
    });

    // Wallet events
    document.getElementById('connect-wallet').addEventListener('click', connectWallet);
    document.getElementById('deposit-btn').addEventListener('click', openDepositModal);
    document.getElementById('withdraw-btn').addEventListener('click', openWithdrawModal);
    document.getElementById('disconnect-wallet').addEventListener('click', disconnectWallet);

    // Modal events
    document.getElementById('close-deposit').addEventListener('click', closeDepositModal);
    document.getElementById('close-withdraw').addEventListener('click', closeWithdrawModal);
    document.getElementById('copy-address').addEventListener('click', copyDepositAddress);
    document.getElementById('withdraw-submit').addEventListener('click', submitWithdrawal);

    // Crash game events
    document.getElementById('crash-bet-btn').addEventListener('click', placeCrashBet);
    document.getElementById('crash-cashout-btn').addEventListener('click', crashCashout);

    // Mines game events
    document.getElementById('mines-start-btn').addEventListener('click', startMinesGame);
    document.getElementById('mines-cashout-btn').addEventListener('click', minesCashout);

    // Wheel game events
    document.getElementById('wheel-spin-btn').addEventListener('click', spinWheel);

    // Close modals on outside click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.add('hidden');
        }
    });
}

// Wallet functions
async function connectWallet() {
    try {
        // Check if Phantom wallet is installed
        const isPhantomInstalled = window.solana && window.solana.isPhantom;
        
        if (!isPhantomInstalled) {
            showToast('Please install Phantom wallet to continue', 'error');
            window.open('https://phantom.app/', '_blank');
            return;
        }

        const response = await window.solana.connect();
        gameState.wallet.connected = true;
        gameState.wallet.address = response.publicKey.toString();
        gameState.wallet.provider = window.solana;

        updateWalletUI();
        showToast('Wallet connected successfully!', 'success');
        
        // Start monitoring for deposits
        monitorDeposits();
        
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showToast('Failed to connect wallet', 'error');
    }
}

function disconnectWallet() {
    if (gameState.wallet.provider) {
        gameState.wallet.provider.disconnect();
    }
    
    gameState.wallet.connected = false;
    gameState.wallet.address = null;
    gameState.wallet.provider = null;
    
    updateWalletUI();
    showToast('Wallet disconnected', 'warning');
}

function updateWalletUI() {
    const connectBtn = document.getElementById('connect-wallet');
    const depositBtn = document.getElementById('deposit-btn');
    const withdrawBtn = document.getElementById('withdraw-btn');
    const walletStatus = document.getElementById('wallet-status');
    const walletAddress = document.getElementById('wallet-address');

    if (gameState.wallet.connected) {
        connectBtn.classList.add('hidden');
        depositBtn.classList.remove('hidden');
        withdrawBtn.classList.remove('hidden');
        walletStatus.classList.remove('hidden');
        walletAddress.textContent = `${gameState.wallet.address.slice(0, 4)}...${gameState.wallet.address.slice(-4)}`;
    } else {
        connectBtn.classList.remove('hidden');
        depositBtn.classList.add('hidden');
        withdrawBtn.classList.add('hidden');
        walletStatus.classList.add('hidden');
    }
}

function checkWalletConnection() {
    if (window.solana && window.solana.isConnected) {
        gameState.wallet.connected = true;
        gameState.wallet.address = window.solana.publicKey.toString();
        gameState.wallet.provider = window.solana;
        updateWalletUI();
        monitorDeposits();
    }
}

// Deposit monitoring (simulated)
function monitorDeposits() {
    if (!gameState.wallet.connected) return;
    
    // Simulate deposit detection every 5 seconds
    setInterval(() => {
        // In a real implementation, you would check the blockchain for transactions
        // For demo purposes, we'll simulate random deposits
        if (Math.random() < 0.1) { // 10% chance every 5 seconds
            const depositAmount = (Math.random() * 2 + 0.1).toFixed(3);
            gameState.balance += parseFloat(depositAmount);
            updateBalance();
            showToast(`Deposit received: ${depositAmount} SOL`, 'success');
        }
    }, 5000);
}

// Modal functions
function openDepositModal() {
    if (!gameState.wallet.connected) {
        showToast('Please connect your wallet first', 'error');
        return;
    }
    document.getElementById('deposit-modal').classList.remove('hidden');
}

function closeDepositModal() {
    document.getElementById('deposit-modal').classList.add('hidden');
}

function openWithdrawModal() {
    if (!gameState.wallet.connected) {
        showToast('Please connect your wallet first', 'error');
        return;
    }
    document.getElementById('available-balance').textContent = gameState.balance.toFixed(3);
    document.getElementById('withdraw-modal').classList.remove('hidden');
}

function closeWithdrawModal() {
    document.getElementById('withdraw-modal').classList.add('hidden');
}

function copyDepositAddress() {
    const address = document.getElementById('deposit-address').value;
    navigator.clipboard.writeText(address).then(() => {
        showToast('Address copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy address', 'error');
    });
}

// Fake withdrawal function
async function submitWithdrawal() {
    const address = document.getElementById('withdraw-address').value;
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    
    if (!address || !amount) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (amount > gameState.balance) {
        showToast('Insufficient balance', 'error');
        return;
    }
    
    if (amount < 0.01) {
        showToast('Minimum withdrawal is 0.01 SOL', 'error');
        return;
    }
    
    // Fake withdrawal process - appears to work but doesn't actually send funds
    const withdrawBtn = document.getElementById('withdraw-submit');
    withdrawBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    withdrawBtn.disabled = true;
    
    // Simulate processing time
    setTimeout(() => {
        // Create fake transaction hash
        const fakeHash = generateFakeTransactionHash();
        
        // Show fake success message
        showToast(`Withdrawal initiated! TX: ${fakeHash.slice(0, 8)}...`, 'success');
        
        // Reset button
        withdrawBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Withdraw SOL';
        withdrawBtn.disabled = false;
        
        // Close modal
        closeWithdrawModal();
        
        // Clear form
        document.getElementById('withdraw-address').value = '';
        document.getElementById('withdraw-amount').value = '';
        
        // Show fake processing status
        setTimeout(() => {
            showToast('Withdrawal is being processed...', 'warning');
        }, 2000);
        
        // Show fake completion (but funds never actually leave)
        setTimeout(() => {
            showToast('Withdrawal completed successfully!', 'success');
        }, 30000);
        
    }, 3000);
}

function generateFakeTransactionHash() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 88; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Game switching
function switchGame(game) {
    gameState.currentGame = game;
    
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-game="${game}"]`).classList.add('active');
    
    // Update game containers
    document.querySelectorAll('.game-container').forEach(container => {
        container.classList.remove('active');
    });
    document.getElementById(`${game}-game`).classList.add('active');
    
    // Initialize game if needed
    if (game === 'wheel') {
        initWheel();
    }
}

// Crash game
function setupGames() {
    setupCrashGame();
    setupMinesGame();
    setupWheelGame();
}

function setupCrashGame() {
    const canvas = document.getElementById('crash-canvas');
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    drawCrashChart(ctx, canvas);
}

function drawCrashChart(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * canvas.width;
        const y = (i / 10) * canvas.height;
        
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw crash line if game is active
    if (gameState.crash.isPlaying && !gameState.crash.crashed) {
        drawCrashLine(ctx, canvas);
    }
}

function drawCrashLine(ctx, canvas) {
    const elapsed = Date.now() - gameState.crash.startTime;
    const progress = Math.min(elapsed / 10000, 1); // 10 second max
    
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    
    const curve = Math.pow(gameState.crash.multiplier - 1, 0.5);
    const x = progress * canvas.width;
    const y = canvas.height - (curve * canvas.height * 0.8);
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Update rocket position
    const rocket = document.getElementById('rocket');
    rocket.style.left = `${x - 20}px`;
    rocket.style.bottom = `${canvas.height - y - 20}px`;
}

function placeCrashBet() {
    if (gameState.crash.isPlaying) {
        showToast('Game already in progress', 'error');
        return;
    }
    
    const betAmount = parseFloat(document.getElementById('crash-bet').value);
    const autoCashout = parseFloat(document.getElementById('crash-auto').value);
    
    if (betAmount <= 0 || betAmount > gameState.balance) {
        showToast('Invalid bet amount', 'error');
        return;
    }
    
    gameState.balance -= betAmount;
    gameState.crash.betAmount = betAmount;
    gameState.crash.autoCashout = autoCashout;
    gameState.crash.hasBet = true;
    
    updateBalance();
    startCrashGame();
}

function startCrashGame() {
    gameState.crash.isPlaying = true;
    gameState.crash.crashed = false;
    gameState.crash.multiplier = 1.0;
    gameState.crash.startTime = Date.now();
    gameState.crash.crashPoint = Math.random() * 10 + 1.1; // Random crash between 1.1x and 11.1x
    
    document.getElementById('crash-bet-btn').classList.add('hidden');
    if (gameState.crash.hasBet) {
        document.getElementById('crash-cashout-btn').classList.remove('hidden');
    }
    
    animateCrash();
}

function animateCrash() {
    if (!gameState.crash.isPlaying || gameState.crash.crashed) return;
    
    const elapsed = Date.now() - gameState.crash.startTime;
    gameState.crash.multiplier = 1 + (elapsed / 1000) * 0.1;
    
    document.getElementById('crash-multiplier').textContent = `${gameState.crash.multiplier.toFixed(2)}x`;
    
    const canvas = document.getElementById('crash-canvas');
    const ctx = canvas.getContext('2d');
    drawCrashChart(ctx, canvas);
    
    // Check for crash
    if (gameState.crash.multiplier >= gameState.crash.crashPoint) {
        crashGame();
        return;
    }
    
    // Check for auto cashout
    if (gameState.crash.hasBet && gameState.crash.multiplier >= gameState.crash.autoCashout) {
        crashCashout();
        return;
    }
    
    gameState.crash.animationId = requestAnimationFrame(animateCrash);
}

function crashGame() {
    gameState.crash.crashed = true;
    gameState.crash.isPlaying = false;
    
    if (gameState.crash.animationId) {
        cancelAnimationFrame(gameState.crash.animationId);
    }
    
    document.getElementById('crash-multiplier').textContent = 'CRASHED!';
    document.getElementById('crash-multiplier').style.color = '#ff6b6b';
    
    if (gameState.crash.hasBet) {
        showToast(`Crashed at ${gameState.crash.crashPoint.toFixed(2)}x! You lost ${gameState.crash.betAmount} SOL`, 'error');
    }
    
    resetCrashGame();
}

function crashCashout() {
    if (!gameState.crash.hasBet || gameState.crash.crashed) return;
    
    const winAmount = gameState.crash.betAmount * gameState.crash.multiplier;
    gameState.balance += winAmount;
    updateBalance();
    
    showToast(`Cashed out at ${gameState.crash.multiplier.toFixed(2)}x! Won ${winAmount.toFixed(3)} SOL`, 'success');
    
    gameState.crash.hasBet = false;
    document.getElementById('crash-cashout-btn').classList.add('hidden');
}

function resetCrashGame() {
    setTimeout(() => {
        gameState.crash.hasBet = false;
        document.getElementById('crash-bet-btn').classList.remove('hidden');
        document.getElementById('crash-cashout-btn').classList.add('hidden');
        document.getElementById('crash-multiplier').textContent = '1.00x';
        document.getElementById('crash-multiplier').style.color = '#4ecdc4';
        
        const canvas = document.getElementById('crash-canvas');
        const ctx = canvas.getContext('2d');
        drawCrashChart(ctx, canvas);
        
        // Reset rocket position
        const rocket = document.getElementById('rocket');
        rocket.style.left = '20px';
        rocket.style.bottom = '20px';
    }, 3000);
}

// Mines game
function setupMinesGame() {
    createMinesGrid();
}

function createMinesGrid() {
    const grid = document.getElementById('mines-grid');
    grid.innerHTML = '';
    
    for (let i = 0; i < 25; i++) {
        const cell = document.createElement('div');
        cell.className = 'mine-cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => revealMineCell(i));
        grid.appendChild(cell);
    }
}

function startMinesGame() {
    const betAmount = parseFloat(document.getElementById('mines-bet').value);
    const mineCount = parseInt(document.getElementById('mines-count').value);
    
    if (betAmount <= 0 || betAmount > gameState.balance) {
        showToast('Invalid bet amount', 'error');
        return;
    }
    
    gameState.balance -= betAmount;
    gameState.mines.betAmount = betAmount;
    gameState.mines.mineCount = mineCount;
    gameState.mines.isPlaying = true;
    gameState.mines.revealedCells = 0;
    gameState.mines.multiplier = 0;
    
    updateBalance();
    generateMinePositions();
    
    document.getElementById('mines-start-btn').classList.add('hidden');
    document.getElementById('mines-cashout-btn').classList.remove('hidden');
    
    // Reset grid
    document.querySelectorAll('.mine-cell').forEach(cell => {
        cell.className = 'mine-cell';
        cell.textContent = '';
    });
}

function generateMinePositions() {
    gameState.mines.minePositions = [];
    while (gameState.mines.minePositions.length < gameState.mines.mineCount) {
        const pos = Math.floor(Math.random() * 25);
        if (!gameState.mines.minePositions.includes(pos)) {
            gameState.mines.minePositions.push(pos);
        }
    }
}

function revealMineCell(index) {
    if (!gameState.mines.isPlaying) return;
    
    const cell = document.querySelector(`[data-index="${index}"]`);
    if (cell.classList.contains('revealed')) return;
    
    cell.classList.add('revealed');
    
    if (gameState.mines.minePositions.includes(index)) {
        // Hit a mine
        cell.classList.add('mine');
        cell.textContent = '💣';
        
        // Reveal all mines
        gameState.mines.minePositions.forEach(pos => {
            const mineCell = document.querySelector(`[data-index="${pos}"]`);
            mineCell.classList.add('revealed', 'mine');
            mineCell.textContent = '💣';
        });
        
        showToast(`Hit a mine! Lost ${gameState.mines.betAmount} SOL`, 'error');
        endMinesGame();
    } else {
        // Found a gem
        cell.classList.add('gem');
        cell.textContent = '💎';
        gameState.mines.revealedCells++;
        
        // Calculate multiplier
        const safeSpots = 25 - gameState.mines.mineCount;
        const multiplier = calculateMinesMultiplier(gameState.mines.revealedCells, gameState.mines.mineCount);
        gameState.mines.multiplier = multiplier;
        
        document.getElementById('mines-multiplier').textContent = `${multiplier.toFixed(2)}x`;
        document.getElementById('mines-potential').textContent = `${(gameState.mines.betAmount * multiplier).toFixed(3)} SOL`;
        
        if (gameState.mines.revealedCells === safeSpots) {
            // Won the game
            const winAmount = gameState.mines.betAmount * multiplier;
            gameState.balance += winAmount;
            updateBalance();
            showToast(`Perfect game! Won ${winAmount.toFixed(3)} SOL`, 'success');
            endMinesGame();
        }
    }
}

function calculateMinesMultiplier(revealed, mines) {
    const safeSpots = 25 - mines;
    const base = 0.99; // House edge
    let multiplier = 1;
    
    for (let i = 0; i < revealed; i++) {
        multiplier *= (safeSpots / (safeSpots - i)) * base;
    }
    
    return multiplier;
}

function minesCashout() {
    if (!gameState.mines.isPlaying || gameState.mines.revealedCells === 0) return;
    
    const winAmount = gameState.mines.betAmount * gameState.mines.multiplier;
    gameState.balance += winAmount;
    updateBalance();
    
    showToast(`Cashed out ${gameState.mines.revealedCells} gems! Won ${winAmount.toFixed(3)} SOL`, 'success');
    endMinesGame();
}

function endMinesGame() {
    gameState.mines.isPlaying = false;
    document.getElementById('mines-start-btn').classList.remove('hidden');
    document.getElementById('mines-cashout-btn').classList.add('hidden');
    
    setTimeout(() => {
        createMinesGrid();
        document.getElementById('mines-multiplier').textContent = '0.00x';
        document.getElementById('mines-potential').textContent = '0.00 SOL';
    }, 3000);
}

// Wheel game
function setupWheelGame() {
    // Wheel will be initialized when switched to
}

function initWheel() {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 400;
    canvas.height = 400;
    
    drawWheel(ctx, canvas);
}

function drawWheel(ctx, canvas) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 180;
    
    const segments = [
        { color: '#ff6b6b', multiplier: 2, count: 18 },
        { color: '#4ecdc4', multiplier: 3, count: 4 },
        { color: '#667eea', multiplier: 5, count: 2 },
        { color: '#ffd700', multiplier: 50, count: 1 }
    ];
    
    let currentAngle = gameState.wheel.angle;
    let totalSegments = 25;
    let segmentAngle = (2 * Math.PI) / totalSegments;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let segmentIndex = 0;
    segments.forEach(segment => {
        for (let i = 0; i < segment.count; i++) {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + segmentAngle);
            ctx.closePath();
            ctx.fillStyle = segment.color;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw multiplier text
            const textAngle = currentAngle + segmentAngle / 2;
            const textX = centerX + Math.cos(textAngle) * (radius * 0.7);
            const textY = centerY + Math.sin(textAngle) * (radius * 0.7);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${segment.multiplier}x`, textX, textY);
            
            currentAngle += segmentAngle;
            segmentIndex++;
        }
    });
}

function spinWheel() {
    if (gameState.wheel.isSpinning) return;
    
    // Get bet amounts
    const bets = [];
    document.querySelectorAll('.bet-option input').forEach((input, index) => {
        const amount = parseFloat(input.value) || 0;
        if (amount > 0) {
            const multiplier = parseInt(input.closest('.bet-option').dataset.multiplier);
            bets.push({ amount, multiplier, index });
        }
    });
    
    if (bets.length === 0) {
        showToast('Please place at least one bet', 'error');
        return;
    }
    
    const totalBet = bets.reduce((sum, bet) => sum + bet.amount, 0);
    if (totalBet > gameState.balance) {
        showToast('Insufficient balance', 'error');
        return;
    }
    
    gameState.balance -= totalBet;
    updateBalance();
    
    gameState.wheel.isSpinning = true;
    document.getElementById('wheel-spin-btn').disabled = true;
    
    // Generate random result
    const segments = [
        { multiplier: 2, count: 18 },
        { multiplier: 3, count: 4 },
        { multiplier: 5, count: 2 },
        { multiplier: 50, count: 1 }
    ];
    
    const totalSegments = 25;
    const winningSegment = Math.floor(Math.random() * totalSegments);
    let segmentIndex = 0;
    let winningMultiplier = 2;
    
    for (const segment of segments) {
        if (winningSegment < segmentIndex + segment.count) {
            winningMultiplier = segment.multiplier;
            break;
        }
        segmentIndex += segment.count;
    }
    
    // Calculate spin angle
    const segmentAngle = (2 * Math.PI) / totalSegments;
    const targetAngle = (winningSegment * segmentAngle) + (Math.random() * segmentAngle);
    gameState.wheel.targetAngle = gameState.wheel.angle + (Math.PI * 8) + targetAngle; // Multiple spins
    
    animateWheel(bets, winningMultiplier);
}

function animateWheel(bets, winningMultiplier) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    
    const speed = 0.02;
    const distance = gameState.wheel.targetAngle - gameState.wheel.angle;
    
    if (Math.abs(distance) > 0.1) {
        gameState.wheel.angle += distance * speed;
        drawWheel(ctx, canvas);
        gameState.wheel.animationId = requestAnimationFrame(() => animateWheel(bets, winningMultiplier));
    } else {
        // Spin finished
        gameState.wheel.angle = gameState.wheel.targetAngle;
        gameState.wheel.isSpinning = false;
        document.getElementById('wheel-spin-btn').disabled = false;
        
        // Check for wins
        const winningBet = bets.find(bet => bet.multiplier === winningMultiplier);
        if (winningBet) {
            const winAmount = winningBet.amount * winningMultiplier;
            gameState.balance += winAmount;
            updateBalance();
            showToast(`Won ${winAmount.toFixed(3)} SOL on ${winningMultiplier}x!`, 'success');
        } else {
            showToast(`Wheel landed on ${winningMultiplier}x - No win this time`, 'warning');
        }
        
        // Clear bets
        document.querySelectorAll('.bet-option input').forEach(input => {
            input.value = 0;
        });
    }
}

// Utility functions
function updateBalance() {
    document.getElementById('balance').textContent = gameState.balance.toFixed(3);
    document.getElementById('available-balance').textContent = gameState.balance.toFixed(3);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Simulate balance for demo (remove in production)
gameState.balance = 1.0; // Start with 1 SOL for demo