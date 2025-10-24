// --- GLOBAL STATE ---
let currentUser = null;
let currentView = 'live';
let isDarkMode = localStorage.getItem('theme') === 'dark';
let isMuted = localStorage.getItem('muted') === 'true';
let dashboardData = null;
let historicalDates = [];
let chatHistory = [];
let sessionToken = localStorage.getItem('sessionToken');

// --- UTILITY FUNCTIONS ---
const applyTheme = () => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.body.classList.toggle('light-mode', !isDarkMode);
    updateThemeIcons();
};

const updateThemeIcons = () => {
    const icons = document.querySelectorAll('.theme-toggle-btn i');
    icons.forEach(icon => {
        icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    });
};

const toggleTheme = () => {
    isDarkMode = !isDarkMode;
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    applyTheme();
};

const toggleMute = () => {
    isMuted = !isMuted;
    localStorage.setItem('muted', isMuted.toString());
    const icon = document.querySelector('#speech-toggle i');
    if (icon) {
        icon.className = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    }
};

const showError = (message) => {
    console.error(message);
    alert(message);
};

const showLoading = (element) => {
    if (element) element.classList.add('loading');
};

const hideLoading = (element) => {
    if (element) element.classList.remove('loading');
};

// --- AUTHENTICATION ---
const generateOTP = () => {
    const btn = document.getElementById('generate-otp-btn');
    const statusEl = document.getElementById('otp-status');
    const progressContainer = document.querySelector('.progress-bar-container');
    const progressBar = document.querySelector('.progress-bar');
    
    showLoading(btn);
    btn.disabled = true;
    statusEl.textContent = 'Sending OTP...';
    statusEl.className = 'otp-status';
    
    google.script.run
        .withSuccessHandler((result) => {
            hideLoading(btn);
            if (result.status === 'success') {
                statusEl.textContent = 'OTP sent to your email!';
                statusEl.className = 'otp-status success';
                btn.textContent = 'Verify OTP';
                btn.onclick = verifyOTP;
                btn.disabled = false;
                
                // Start countdown
                progressContainer.classList.add('active');
                let timeLeft = 180; // 3 minutes
                const interval = setInterval(() => {
                    timeLeft--;
                    const percentage = (timeLeft / 180) * 100;
                    progressBar.style.width = percentage + '%';
                    
                    if (timeLeft <= 0) {
                        clearInterval(interval);
                        progressContainer.classList.remove('active');
                        statusEl.textContent = 'OTP expired. Please generate a new one.';
                        statusEl.className = 'otp-status error';
                        btn.textContent = 'Generate OTP';
                        btn.onclick = generateOTP;
                    }
                }, 1000);
                
                // Enable OTP inputs
                document.querySelectorAll('.otp-input').forEach((input, index) => {
                    input.disabled = false;
                    if (index === 0) input.focus();
                });
            } else {
                statusEl.textContent = result.message || 'Failed to send OTP';
                statusEl.className = 'otp-status error';
                btn.disabled = false;
            }
        })
        .withFailureHandler((error) => {
            hideLoading(btn);
            statusEl.textContent = 'Error: ' + error.message;
            statusEl.className = 'otp-status error';
            btn.disabled = false;
        })
        .generateOTPServer('amit3ree@gmail.com');
};

const verifyOTP = () => {
    const inputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(inputs).map(input => input.value).join('');
    
    if (otp.length !== 6) {
        const statusEl = document.getElementById('otp-status');
        statusEl.textContent = 'Please enter all 6 digits';
        statusEl.className = 'otp-status error';
        return;
    }
    
    const formattedOTP = otp.substring(0, 3) + '-' + otp.substring(3);
    const btn = document.getElementById('generate-otp-btn');
    const statusEl = document.getElementById('otp-status');
    
    showLoading(btn);
    btn.disabled = true;
    statusEl.textContent = 'Verifying...';
    statusEl.className = 'otp-status';
    
    google.script.run
        .withSuccessHandler((result) => {
            hideLoading(btn);
            if (result.status === 'success') {
                sessionToken = result.sessionToken;
                currentUser = result.userInfo;
                localStorage.setItem('sessionToken', sessionToken);
                statusEl.textContent = 'Login successful!';
                statusEl.className = 'otp-status success';
                setTimeout(() => {
                    showMainApp();
                }, 500);
            } else {
                statusEl.textContent = result.message || 'Invalid OTP';
                statusEl.className = 'otp-status error';
                btn.disabled = false;
            }
        })
        .withFailureHandler((error) => {
            hideLoading(btn);
            statusEl.textContent = 'Error: ' + error.message;
            statusEl.className = 'otp-status error';
            btn.disabled = false;
        })
        .verifyOTPServer('amit3ree@gmail.com', formattedOTP);
};

const verifySession = () => {
    if (!sessionToken) {
        renderLoginView();
        return;
    }
    
    google.script.run
        .withSuccessHandler((result) => {
            if (result.status === 'success') {
                currentUser = result.userInfo;
                showMainApp();
            } else {
                localStorage.removeItem('sessionToken');
                sessionToken = null;
                renderLoginView();
            }
        })
        .withFailureHandler(() => {
            localStorage.removeItem('sessionToken');
            sessionToken = null;
            renderLoginView();
        })
        .verifySessionServer(sessionToken);
};

// --- VIEW RENDERING ---
const renderLoginView = () => {
    const loginView = document.getElementById('login-view');
    loginView.innerHTML = `
        <div class="login-container">
            <div class="theme-switch-container">
                <button id="theme-toggle-login" class="theme-toggle-btn">
                    <i class="fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}"></i>
                </button>
            </div>
            <div class="login-box glass-card">
                <div class="logo-container">
                    <div class="logo">M</div>
                    <h2>Maurvi Consultants</h2>
                    <h1>Trading Signals</h1>
                </div>
                <div class="otp-section">
                    <p>Enter OTP sent to your registered email.</p>
                    <div class="otp-inputs">
                        <input type="text" maxlength="1" class="otp-input" disabled />
                        <input type="text" maxlength="1" class="otp-input" disabled />
                        <input type="text" maxlength="1" class="otp-input" disabled />
                        <span>-</span>
                        <input type="text" maxlength="1" class="otp-input" disabled />
                        <input type="text" maxlength="1" class="otp-input" disabled />
                        <input type="text" maxlength="1" class="otp-input" disabled />
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
    
    showView('login-view');
    
    // Event listeners
    document.getElementById('theme-toggle-login').addEventListener('click', toggleTheme);
    document.getElementById('generate-otp-btn').addEventListener('click', generateOTP);
    
    // OTP input auto-advance
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });
};

const renderMainView = () => {
    const mainView = document.getElementById('main-view');
    mainView.innerHTML = `
        <header class="main-header">
            <div class="logo-main" id="logo-home">M</div>
            <nav>
                <div class="nav-slider">
                    <button data-view="live" class="nav-btn active">Live Feed</button>
                    <button data-view="logs" class="nav-btn">Logs</button>
                    <button data-view="historical" class="nav-btn">Historical</button>
                </div>
                <div class="header-controls">
                    <button id="speech-toggle" class="control-btn">
                        <i class="fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'}"></i>
                    </button>
                    <button id="theme-toggle-main" class="control-btn">
                        <i class="fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}"></i>
                    </button>
                </div>
            </nav>
        </header>
        <main id="content-area">
            <!-- Content will be injected here -->
        </main>
        
        <!-- Signal Detail Modal -->
        <div id="signal-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="modal-symbol"></h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div id="modal-body">
                    <!-- Modal content will be injected here -->
                </div>
            </div>
        </div>
        
        <!-- Gemini Chat -->
        <button class="chat-toggle-btn" id="chat-toggle">
            <i class="fas fa-comment-dots"></i>
        </button>
        <div class="chat-container" id="chat-container">
            <div class="chat-header">
                <h3>Gemini Assistant</h3>
                <button class="close-btn" id="chat-close">&times;</button>
            </div>
            <div class="chat-messages" id="chat-messages">
                <div class="chat-message assistant">
                    Hello! I'm here to help you analyze trading signals. Ask me anything!
                </div>
            </div>
            <div class="chat-input-container">
                <input type="text" class="chat-input" id="chat-input" placeholder="Type your message...">
                <button class="chat-send-btn" id="chat-send">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
    
    // Event listeners
    document.getElementById('theme-toggle-main').addEventListener('click', toggleTheme);
    document.getElementById('speech-toggle').addEventListener('click', toggleMute);
    document.getElementById('logo-home').addEventListener('click', () => switchTab('live'));
    
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.view));
    });
    
    // Modal
    document.querySelector('#signal-modal .close-btn').addEventListener('click', closeModal);
    document.getElementById('signal-modal').addEventListener('click', (e) => {
        if (e.target.id === 'signal-modal') closeModal();
    });
    
    // Chat
    document.getElementById('chat-toggle').addEventListener('click', toggleChat);
    document.getElementById('chat-close').addEventListener('click', toggleChat);
    document.getElementById('chat-send').addEventListener('click', sendChatMessage);
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
    
    // Load initial data
    loadDashboardData();
};

const showMainApp = () => {
    renderMainView();
    showView('main-view');
};

const showView = (viewId) => {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
};

const switchTab = (tab) => {
    currentView = tab;
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === tab);
    });
    
    switch(tab) {
        case 'live':
            renderLiveFeed();
            break;
        case 'logs':
            renderLogs();
            break;
        case 'historical':
            renderHistorical();
            break;
    }
};

// --- DASHBOARD/LIVE FEED ---
const loadDashboardData = () => {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '<div style="text-align: center; padding: 50px;">Loading data...</div>';
    
    google.script.run
        .withSuccessHandler((data) => {
            if (data.error) {
                showError('Error loading data: ' + data.error);
                return;
            }
            dashboardData = data;
            renderLiveFeed();
        })
        .withFailureHandler((error) => {
            showError('Failed to load data: ' + error.message);
        })
        .getDashboardData();
};

const renderLiveFeed = () => {
    if (!dashboardData) {
        loadDashboardData();
        return;
    }
    
    const contentArea = document.getElementById('content-area');
    const { kpi, niftyData, tickers, dashboardSyncedList, liveFeed } = dashboardData;
    
    const niftyCard = niftyData ? `
        <div class="kpi-card glass-card">
            <h3>Nifty</h3>
            <div class="value">${niftyData.ticker}</div>
            <div class="label">${niftyData.reason}</div>
            <div class="label" style="margin-top: 5px; font-size: 0.75rem;">${niftyData.timestamp}</div>
        </div>
    ` : `
        <div class="kpi-card glass-card">
            <h3>Nifty</h3>
            <div class="value">-</div>
            <div class="label">No data</div>
        </div>
    `;
    
    contentArea.innerHTML = `
        <div class="kpi-cards">
            ${niftyCard}
            <div class="kpi-card glass-card">
                <h3>Total Signals</h3>
                <div class="value">${kpi.totalSignals}</div>
                <div class="label">Today</div>
            </div>
            <div class="kpi-card glass-card">
                <h3>Synced Symbols</h3>
                <div class="value status-synced">${kpi.syncedSignals}</div>
                <div class="label">Active</div>
            </div>
            <div class="kpi-card glass-card">
                <h3>Latest Signal</h3>
                <div class="value">${kpi.latestSignal}</div>
                <div class="label">Most Recent</div>
            </div>
        </div>
        
        <div class="ticker-section">
            <h2>HVD Signals</h2>
            <div class="ticker-container">
                <div class="ticker-content">
                    ${tickers.hvd.concat(tickers.hvd).map(signal => `
                        <div class="ticker-item">
                            <div class="symbol">${signal.symbol}</div>
                            <div class="reason">${signal.reason}${signal.capital ? ' (' + signal.capital + ' Cr.)' : ''}</div>
                            <div class="reason">${signal.time}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div class="ticker-section">
            <h2>Pattern-Based Signals</h2>
            <div class="ticker-container">
                <div class="ticker-content">
                    ${tickers.patterns.concat(tickers.patterns).map(signal => `
                        <div class="ticker-item">
                            <div class="symbol">${signal.symbol}</div>
                            <div class="reason">${signal.reason}</div>
                            <div class="reason">${signal.time}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div class="ticker-section">
            <h2>Synced Signals</h2>
            <div class="signals-list">
                ${dashboardSyncedList.map(signal => `
                    <div class="signal-card glass-card" onclick="showSignalDetail('${signal.symbol}', ${JSON.stringify(signal).replace(/"/g, '&quot;')})">
                        <div class="signal-header">
                            <div class="signal-symbol">${signal.symbol}</div>
                            <div class="signal-time status-synced">Synced</div>
                        </div>
                        <div class="signal-reasons">
                            <div class="ind1">Indicator 1: ${signal.ind1Reason}</div>
                            <div class="ind2">Indicator 2: ${signal.ind2Reasons.map(r => r.reason).join(', ')}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Speak synced symbols if not muted
    if (!isMuted && dashboardSyncedList.length > 0) {
        speakSyncedSymbols(dashboardSyncedList);
    }
};

const speakSyncedSymbols = (signals) => {
    if ('speechSynthesis' in window) {
        const text = `${signals.length} symbols synced: ${signals.map(s => s.symbol).join(', ')}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
    }
};

const showSignalDetail = (symbol, signalData) => {
    const modal = document.getElementById('signal-modal');
    const modalSymbol = document.getElementById('modal-symbol');
    const modalBody = document.getElementById('modal-body');
    
    modalSymbol.textContent = symbol;
    modalBody.innerHTML = `
        <div>
            <h3>Indicator 1 Trigger</h3>
            <p>${signalData.ind1Reason}</p>
            
            <h3>Indicator 2 Syncs</h3>
            ${signalData.ind2Reasons.map(r => `
                <p><strong>${r.time}:</strong> ${r.reason}</p>
            `).join('')}
            
            <h3 style="margin-top: 30px;">Gemini Analysis</h3>
            <div class="analysis-content">Loading analysis...</div>
            
            <button class="cta-btn" style="margin-top: 20px;" onclick="openChat('${symbol}')">
                Ask Gemini About This Signal
            </button>
        </div>
    `;
    
    modal.classList.add('active');
    
    // Load Gemini analysis
    google.script.run
        .withSuccessHandler((result) => {
            const analysisDiv = document.querySelector('.analysis-content');
            if (result.error) {
                analysisDiv.innerHTML = `<p style="color: var(--red);">${result.error}</p>`;
            } else {
                analysisDiv.innerHTML = `<p>${result.analysis}</p>`;
            }
        })
        .withFailureHandler((error) => {
            const analysisDiv = document.querySelector('.analysis-content');
            analysisDiv.innerHTML = `<p style="color: var(--red);">Error loading analysis: ${error.message}</p>`;
        })
        .analyzeSignalWithGemini(symbol, signalData.ind1Reason, signalData.ind2Reasons);
};

const closeModal = () => {
    document.getElementById('signal-modal').classList.remove('active');
};

// --- LOGS VIEW ---
const renderLogs = () => {
    if (!dashboardData) {
        loadDashboardData();
        return;
    }
    
    const contentArea = document.getElementById('content-area');
    const { logs } = dashboardData;
    
    contentArea.innerHTML = `
        <h2 style="margin-bottom: 20px;">Today's Signal Logs</h2>
        <div class="logs-container">
            <div class="log-panel glass-card">
                <h3>HVD Signals (${logs.hvd.length})</h3>
                ${logs.hvd.map(log => `
                    <div class="log-item">
                        <div><strong>${log.symbol}</strong></div>
                        <div>${log.reason}${log.capital ? ' - ' + log.capital + ' Cr.' : ''}</div>
                        <div class="time">${log.time}</div>
                    </div>
                `).join('') || '<p style="opacity: 0.5;">No HVD signals today</p>'}
            </div>
            
            <div class="log-panel glass-card">
                <h3>Bullish Patterns (${logs.bullish.length})</h3>
                ${logs.bullish.map(log => `
                    <div class="log-item">
                        <div><strong>${log.symbol}</strong></div>
                        <div>${log.reason}</div>
                        <div class="time">${log.time}</div>
                    </div>
                `).join('') || '<p style="opacity: 0.5;">No bullish patterns today</p>'}
            </div>
            
            <div class="log-panel glass-card">
                <h3>Bearish Patterns (${logs.bearish.length})</h3>
                ${logs.bearish.map(log => `
                    <div class="log-item">
                        <div><strong>${log.symbol}</strong></div>
                        <div>${log.reason}</div>
                        <div class="time">${log.time}</div>
                    </div>
                `).join('') || '<p style="opacity: 0.5;">No bearish patterns today</p>'}
            </div>
            
            <div class="log-panel glass-card">
                <h3>Oversold (${logs.oversold.length})</h3>
                ${logs.oversold.map(log => `
                    <div class="log-item">
                        <div><strong>${log.symbol}</strong></div>
                        <div>${log.reason}</div>
                        <div class="time">${log.time}</div>
                    </div>
                `).join('') || '<p style="opacity: 0.5;">No oversold signals today</p>'}
            </div>
            
            <div class="log-panel glass-card">
                <h3>Overbought (${logs.overbought.length})</h3>
                ${logs.overbought.map(log => `
                    <div class="log-item">
                        <div><strong>${log.symbol}</strong></div>
                        <div>${log.reason}</div>
                        <div class="time">${log.time}</div>
                    </div>
                `).join('') || '<p style="opacity: 0.5;">No overbought signals today</p>'}
            </div>
        </div>
    `;
};

// --- HISTORICAL VIEW ---
const renderHistorical = () => {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '<div style="text-align: center; padding: 50px;">Loading historical dates...</div>';
    
    google.script.run
        .withSuccessHandler((dates) => {
            if (dates.error) {
                showError('Error loading dates: ' + dates.error);
                return;
            }
            historicalDates = dates;
            showHistoricalDates();
        })
        .withFailureHandler((error) => {
            showError('Failed to load dates: ' + error.message);
        })
        .getHistoricalDates();
};

const showHistoricalDates = () => {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="historical-header">
            <h2>Historical Signals</h2>
            <p style="opacity: 0.7; margin-bottom: 20px;">Select a date to view signals</p>
            <div class="date-selector">
                ${historicalDates.map(date => `
                    <button class="date-btn" onclick="loadHistoricalSignals('${date}')">
                        ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </button>
                `).join('')}
            </div>
        </div>
        <div id="historical-signals"></div>
    `;
};

const loadHistoricalSignals = (date) => {
    const signalsDiv = document.getElementById('historical-signals');
    signalsDiv.innerHTML = '<div style="text-align: center; padding: 30px;">Loading signals...</div>';
    
    // Update active date button
    document.querySelectorAll('.date-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.trim() === new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    });
    
    google.script.run
        .withSuccessHandler((data) => {
            if (data.error) {
                signalsDiv.innerHTML = `<p style="color: var(--red); text-align: center; padding: 30px;">${data.error}</p>`;
                return;
            }
            
            const syncedSignals = data.signals.filter(s => s.status === 'Synced');
            const awaitingSignals = data.signals.filter(s => s.status === 'Awaiting');
            
            signalsDiv.innerHTML = `
                <div style="margin-top: 30px;">
                    <h3>Synced Signals (${syncedSignals.length})</h3>
                    <div class="signals-list">
                        ${syncedSignals.map(signal => `
                            <div class="signal-card glass-card">
                                <div class="signal-header">
                                    <div class="signal-symbol">${signal.symbol}</div>
                                    <div class="signal-time">${signal.time}</div>
                                </div>
                                <div class="signal-reasons">
                                    <div class="ind1">Ind1: ${signal.reason}</div>
                                    ${signal.syncReason ? `<div class="ind2">Ind2 (${signal.syncTime}): ${signal.syncReason}</div>` : ''}
                                </div>
                            </div>
                        `).join('') || '<p style="opacity: 0.5;">No synced signals</p>'}
                    </div>
                    
                    <h3 style="margin-top: 30px;">Awaiting Signals (${awaitingSignals.length})</h3>
                    <div class="signals-list">
                        ${awaitingSignals.map(signal => `
                            <div class="signal-card glass-card">
                                <div class="signal-header">
                                    <div class="signal-symbol">${signal.symbol}</div>
                                    <div class="signal-time status-awaiting">${signal.time}</div>
                                </div>
                                <div class="signal-reasons">
                                    <div class="ind1">${signal.reason}</div>
                                </div>
                            </div>
                        `).join('') || '<p style="opacity: 0.5;">No awaiting signals</p>'}
                    </div>
                </div>
            `;
        })
        .withFailureHandler((error) => {
            signalsDiv.innerHTML = `<p style="color: var(--red); text-align: center; padding: 30px;">Error: ${error.message}</p>`;
        })
        .getSignalsForDate(date);
};

// --- GEMINI CHAT ---
const toggleChat = () => {
    const chatContainer = document.getElementById('chat-container');
    const chatToggle = document.getElementById('chat-toggle');
    chatContainer.classList.toggle('active');
    chatToggle.style.display = chatContainer.classList.contains('active') ? 'none' : 'block';
};

const openChat = (symbol) => {
    closeModal();
    toggleChat();
    const input = document.getElementById('chat-input');
    input.value = `Tell me more about ${symbol}`;
    input.focus();
};

const sendChatMessage = () => {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    const messagesDiv = document.getElementById('chat-messages');
    
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.textContent = message;
    messagesDiv.appendChild(userMsg);
    
    input.value = '';
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    // Add loading message
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'chat-message assistant loading';
    loadingMsg.textContent = 'Thinking...';
    messagesDiv.appendChild(loadingMsg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    google.script.run
        .withSuccessHandler((result) => {
            messagesDiv.removeChild(loadingMsg);
            
            if (result.error) {
                const errorMsg = document.createElement('div');
                errorMsg.className = 'chat-message assistant';
                errorMsg.textContent = 'Error: ' + result.error;
                messagesDiv.appendChild(errorMsg);
            } else {
                const assistantMsg = document.createElement('div');
                assistantMsg.className = 'chat-message assistant';
                assistantMsg.textContent = result.reply;
                messagesDiv.appendChild(assistantMsg);
                
                chatHistory.push(
                    { role: 'user', parts: [{ text: message }] },
                    { role: 'model', parts: [{ text: result.reply }] }
                );
            }
            
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        })
        .withFailureHandler((error) => {
            messagesDiv.removeChild(loadingMsg);
            const errorMsg = document.createElement('div');
            errorMsg.className = 'chat-message assistant';
            errorMsg.textContent = 'Error: ' + error.message;
            messagesDiv.appendChild(errorMsg);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        })
        .chatWithGemini(message, chatHistory);
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    
    if (sessionToken) {
        verifySession();
    } else {
        renderLoginView();
    }
});
