// Mock data for demonstration
let bets = [
    {
        id: 1,
        title: "BTC/USDT цена через 1 час",
        options: ["Выше $65,000", "Ниже $65,000"],
        timer: "00:45:12"
    }
];

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const betsList = document.querySelector('.bets-list');
const createBetForm = document.querySelector('.create-bet-form');
const connectWalletButton = document.querySelector('.connect-wallet-button');
const walletAddressDisplay = document.getElementById('wallet-address');
const balanceDisplay = document.getElementById('balance');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadBets();
    setupTabSwitching();
    setupCreateBetForm();
    setupWalletConnection();
});

// Load bets into the bets list
function loadBets() {
    betsList.innerHTML = ''; // Clear existing
    bets.forEach(bet => {
        const betCard = document.createElement('div');
        betCard.className = 'bet-card';
        betCard.innerHTML = `
            <div class="bet-title">${bet.title}</div>
            <div class="bet-options">
                ${bet.options.map(option => `<button class="bet-option">${option}</button>`).join('')}
            </div>
            <div class="bet-timer">Осталось: ${bet.timer}</div>
        `;
        betsList.appendChild(betCard);
    });
}

// Tab switching
function setupTabSwitching() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab') + '-tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Create bet form submission
function setupCreateBetForm() {
    createBetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('event-title').value;
        const type = document.getElementById('event-type').value;
        const optionsInput = document.getElementById('outlet-option').value;
        const closeTime = document.getElementById('close-time').value;
        
        // Basic validation
        if (!title || !type || !optionsInput || !closeTime) {
            alert('Пожалуйста, заполните все поля');
            return;
        }
        
        const options = optionsInput.split(',').map(opt => opt.trim()).filter(opt => opt);
        
        // Create new bet object (in a real app, this would be sent to the backend)
        const newBet = {
            id: Date.now(), // Temporary ID
            title,
            options,
            timer: "00:00:00" // Would be calculated from closeTime
        };
        
        bets.push(newBet);
        loadBets();
        
        // Reset form and switch to bets tab
        createBetForm.reset();
        switchTab('bets');
        
        alert('Ставка успешно создана!');
    });
}

// Wallet connection (mock)
function setupWalletConnection() {
    connectWalletButton.addEventListener('click', () => {
        // In a real app, this would trigger TON Connect
        // For now, we'll mock a connected wallet
        const mockAddress = "UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0"; // Admin wallet for demo
        walletAddressDisplay.textContent = mockAddress;
        balanceDisplay.textContent = "100.5"; // Mock balance
        connectWalletButton.textContent = "Кошелек подключен";
        connectWalletButton.style.backgroundColor = "#28a745"; // Green to indicate connected
    });
}

// Helper function to switch tabs
function switchTab(tabName) {
    tabButtons.forEach(button => {
        if (button.getAttribute('data-tab') === tabName) {
            button.click();
        }
    });
}