<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maurvi Consultants - Automated Trading Signals</title>
    <link rel="stylesheet" href="styles.css">
    <script src="https://kit.fontawesome.com/a076d05399.js"></script>
</head>
<body>
    <div id="app">
        <div id="login-view" class="view">
            <!-- Login view content will be injected here -->
        </div>
        <div id="main-view" class="view">
            <!-- Main app view content will be injected here -->
        </div>
    </div>

    document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    const loginView = document.getElementById('login-view');
    const mainView = document.getElementById('main-view');

    // --- THEME SWITCH ---
    let isDarkMode = localStorage.getItem('theme') === 'dark';
    
    const applyTheme = () => {
        document.body.classList.toggle('dark-mode', isDarkMode);
        document.body.classList.toggle('light-mode', !isDarkMode);
    };

    const toggleTheme = () => {
        isDarkMode = !isDarkMode;
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        applyTheme();
    };

    applyTheme(); // Apply theme on initial load

    // --- LOGIN VIEW ---
    const renderLoginView = () => {
        loginView.innerHTML = `
            <div class="login-container">
                <div class="theme-switch-container">
                    <button id="theme-toggle-login" class="theme-toggle-btn">
                        <i class="fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}"></i>
                    </button>
                </div>
                <div class="login-box">
                    <div class="logo-container">
                        <div class="logo">M</div>
                        <h2>Maurvi Consultants</h2>
                        <h1>Automated Trading Signals</h1>
                    </div>
                    <div class="otp-section">
                        <p>Enter OTP sent to your registered email.</p>
                        <div class="otp-inputs">
                            <input type="text" maxlength="1" class="otp-input" />
                            <input type="text" maxlength="1" class="otp-input" />
                            <input type="text" maxlength="1" class="otp-input" />
                            <span>-</span>
                            <input type="text" maxlength="1" class="otp-input" />
                            <input type="text" maxlength="1" class="otp-input" />
                            <input type="text" maxlength="1" class="otp-input" />
                        </div>
                        <button id="generate-otp-btn" class="cta-btn">Generate OTP</button>
                        <div class="progress-bar-container">
                            <div class="progress-bar"></div>
                        </div>
                        <p id="otp-status" class="otp-status"></p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('theme-toggle-login').addEventListener('click', toggleTheme);
        // Add other login event listeners here
    };

    // --- MAIN APP VIEW ---
    const renderMainView = () => {
        mainView.innerHTML = `
            <header class="main-header">
                <div class="logo-main">M</div>
                <nav>
                    <div class="nav-slider">
                        <button data-view="live" class="nav-btn active">Live Feed</button>
                        <button data-view="logs" class="nav-btn">Logs</button>
                        <button data-view="historical" class="nav-btn">Historical</button>
                    </div>
                    <div class="header-controls">
                        <button id="speech-toggle" class="control-btn"><i class="fas fa-volume-up"></i></button>
                        <button id="theme-toggle-main" class="control-btn"><i class="fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}"></i></button>
                    </div>
                </nav>
            </header>
            <main id="content-area">
                <!-- Content for Live, Logs, Historical will be injected here -->
            </main>
        `;
        document.getElementById('theme-toggle-main').addEventListener('click', toggleTheme);
        // Add other main view event listeners here
    };


    // --- ROUTING ---
    const showView = (viewId) => {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
    };

    // --- INITIALIZATION ---
    const init = () => {
        // For now, just show the login view.
        // Later, we'll check for a valid session token.
        renderLoginView();
        showView('login-view');
        
        // For development, you might want to bypass login:
        // renderMainView();
        // showView('main-view');
    };

    init();
});
</body>
</html>
