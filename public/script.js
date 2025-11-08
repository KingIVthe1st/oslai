class SkinCareAI {
    constructor() {
        // API configuration - Worker URL
        this.API_BASE_URL = 'https://osl-skin-ai.ivanleejackson.workers.dev';

        this.modal = document.getElementById('chatModal');
        this.authModal = document.getElementById('authModal');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.tryItOutBtn = document.getElementById('tryItOutBtn');
        this.subscribeBtn = document.getElementById('subscribeBtn');
        this.closeBtn = document.querySelector('.close');
        this.authCloseBtn = document.querySelector('.auth-close');
        this.imageUpload = document.getElementById('imageUpload');
        this.imagePreview = document.getElementById('imagePreview');
        this.previewImg = document.getElementById('previewImg');
        this.removeImageBtn = document.getElementById('removeImage');
        this.authBtn = document.getElementById('authBtn');
        this.authBtnMobile = document.getElementById('authBtnMobile');
        this.authForm = document.getElementById('authForm');
        this.toggleAuth = document.getElementById('toggleAuth');

        this.conversationHistory = [];
        this.isWaitingForResponse = false;
        this.uploadedImage = null;
        this.currentUser = null;
        this.isSignUp = false;

        this.initializeEventListeners();
        this.checkAuthentication();
    }

    initializeEventListeners() {
        // Modal controls
        this.tryItOutBtn.addEventListener('click', () => this.handleTryItOut());
        this.subscribeBtn.addEventListener('click', () => this.handleSubscribe());
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.authCloseBtn.addEventListener('click', () => this.closeAuthModal());

        // Auth buttons
        this.authBtn.addEventListener('click', () => this.openAuthModal());
        this.authBtnMobile.addEventListener('click', () => this.openAuthModal());
        this.toggleAuth.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthMode();
        });
        this.authForm.addEventListener('submit', (e) => this.handleAuth(e));

        // Close modals when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.closeModal();
            }
            if (event.target === this.authModal) {
                this.closeAuthModal();
            }
        });

        // Send message
        this.sendBtn.addEventListener('click', () => this.sendMessage());

        // Enter key to send
        this.chatInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.sendMessage();
            }
        });

        // Image upload
        this.imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        this.removeImageBtn.addEventListener('click', () => this.removeImage());

        // Mobile menu
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');
        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener('click', function() {
                mobileMenu.classList.toggle('active');
            });

            document.querySelectorAll('.mobile-nav-link').forEach(link => {
                link.addEventListener('click', function() {
                    mobileMenu.classList.remove('active');
                });
            });
        }
    }

    async checkAuthentication() {
        const token = localStorage.getItem('oslai_token');
        if (token) {
            try {
                const response = await fetch(`${this.API_BASE_URL}/api/user`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    this.currentUser = await response.json();
                    this.updateAuthUI();
                } else {
                    localStorage.removeItem('oslai_token');
                }
            } catch (error) {
                console.error('Auth check failed:', error);
            }
        }
    }

    updateAuthUI() {
        if (this.currentUser) {
            this.authBtn.textContent = this.currentUser.email;
            this.authBtnMobile.textContent = this.currentUser.email;
        } else {
            this.authBtn.textContent = 'Sign In';
            this.authBtnMobile.textContent = 'Sign In';
        }
    }

    toggleAuthMode() {
        this.isSignUp = !this.isSignUp;
        const title = document.getElementById('authModalTitle');
        const submitBtn = document.getElementById('authSubmitBtn');
        const toggleText = this.toggleAuth;

        if (this.isSignUp) {
            title.textContent = 'Sign Up for OSL Skin AI';
            submitBtn.textContent = 'Sign Up';
            toggleText.innerHTML = 'Already have an account? <a href="#">Sign in</a>';
        } else {
            title.textContent = 'Sign In to OSL Skin AI';
            submitBtn.textContent = 'Sign In';
            toggleText.innerHTML = 'Don\\'t have an account? <a href="#">Sign up</a>';
        }
    }

    async handleAuth(e) {
        e.preventDefault();
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;

        try {
            const endpoint = this.isSignUp ? `${this.API_BASE_URL}/api/auth/signup` : `${this.API_BASE_URL}/api/auth/signin`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('oslai_token', data.token);
                this.currentUser = data.user;
                this.updateAuthUI();
                this.closeAuthModal();

                // If signing up, redirect to subscribe
                if (this.isSignUp) {
                    this.handleSubscribe();
                }
            } else {
                alert(data.error || 'Authentication failed');
            }
        } catch (error) {
            console.error('Auth error:', error);
            alert('Authentication failed. Please try again.');
        }
    }

    handleTryItOut() {
        if (!this.currentUser) {
            alert('Please sign in to use the AI assistant');
            this.openAuthModal();
            return;
        }

        if (!this.currentUser.hasActiveSubscription) {
            alert('Please subscribe to access the AI assistant');
            this.handleSubscribe();
            return;
        }

        this.openModal();
    }

    async handleSubscribe() {
        if (!this.currentUser) {
            alert('Please sign in first');
            this.openAuthModal();
            return;
        }

        try {
            const token = localStorage.getItem('oslai_token');
            const response = await fetch(`${this.API_BASE_URL}/api/stripe/checkout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Failed to create checkout session');
            }
        } catch (error) {
            console.error('Subscription error:', error);
            alert('Failed to start subscription process');
        }
    }

    openAuthModal() {
        this.authModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeAuthModal() {
        this.authModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('emailInput').value = '';
        document.getElementById('passwordInput').value = '';
    }

    openModal() {
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Clear previous conversation
        this.chatMessages.innerHTML = '';
        this.conversationHistory = [];
        this.uploadedImage = null;

        // Start with initial AI message
        setTimeout(() => {
            this.addAIMessage(
                "Hello! I'm your OSL Skin AI assistant. I'm here to help you with your skin care journey.\\n\\n" +
                "**You can:**\\n" +
                "- Upload a photo of your skin for AI analysis\\n" +
                "- Ask questions about skin care, brightening, or anti-aging\\n" +
                "- Get personalized product recommendations\\n\\n" +
                "How can I help you today?"
            );

            this.chatInput.disabled = false;
            this.sendBtn.disabled = false;
            this.chatInput.focus();
        }, 500);
    }

    closeModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.chatInput.disabled = true;
        this.sendBtn.disabled = true;
        this.removeImage();
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be smaller than 5MB');
            return;
        }

        // Read and preview image
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewImg.src = e.target.result;
            this.imagePreview.style.display = 'block';
            this.uploadedImage = {
                data: e.target.result,
                name: file.name,
                type: file.type
            };
        };
        reader.readAsDataURL(file);
    }

    removeImage() {
        this.uploadedImage = null;
        this.previewImg.src = '';
        this.imagePreview.style.display = 'none';
        this.imageUpload.value = '';
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if ((!message && !this.uploadedImage) || this.isWaitingForResponse) return;

        // Add user message
        const displayMessage = message || '[Image uploaded]';
        this.addUserMessage(displayMessage);
        this.chatInput.value = '';

        // Prepare message payload
        const payload = {
            message: message,
            conversationHistory: this.conversationHistory
        };

        // Add image if uploaded
        if (this.uploadedImage) {
            payload.image = this.uploadedImage;
            this.removeImage();
        }

        // Add to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: message,
            hasImage: !!payload.image
        });

        // Show typing indicator
        this.showTypingIndicator();
        this.isWaitingForResponse = true;
        this.sendBtn.disabled = true;

        try {
            const token = localStorage.getItem('oslai_token');
            const response = await fetch(`${this.API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();

            // Hide loading indicator
            this.hideTypingIndicator();

            if (responseData.success && responseData.content) {
                const formattedContent = this.formatMessage(responseData.content);
                const messageElement = this.addAIMessage('');
                messageElement.innerHTML = formattedContent;
                this.scrollToBottom();

                // Add AI response to conversation history
                this.conversationHistory.push({
                    role: 'assistant',
                    content: responseData.content
                });
            } else {
                this.addAIMessage('I apologize, but I didn\\'t receive a complete response. Please try again.');
            }

        } catch (error) {
            this.hideTypingIndicator();
            this.addAIMessage('I apologize, but I encountered an error. Please try again or check your connection.');
            console.error('Error:', error);
        } finally {
            this.isWaitingForResponse = false;
            this.sendBtn.disabled = false;
        }
    }

    addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.textContent = message;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addAIMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai-message';

        const formattedMessage = this.formatMessage(message);
        messageDiv.innerHTML = formattedMessage;

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        return messageDiv;
    }

    formatMessage(message) {
        let formatted = message
            .trim()
            .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
            .replace(/\\*(.*?)\\*/g, '<em>$1</em>')
            .replace(/\\n{3,}/g, '\\n\\n')
            .split('\\n\\n')
            .map(paragraph => {
                if (paragraph.startsWith('**') && paragraph.includes(':**')) {
                    return `<div class="section-header">${paragraph}</div>`;
                } else if (paragraph.includes('\\n- ') || paragraph.includes('\\n• ')) {
                    const listItems = paragraph.split('\\n')
                        .filter(line => line.trim())
                        .map(line => {
                            if (line.startsWith('- ') || line.startsWith('• ')) {
                                return `<li>${line.substring(2)}</li>`;
                            }
                            return line;
                        });
                    if (listItems.some(item => item.startsWith('<li>'))) {
                        return `<ul>${listItems.filter(item => item.startsWith('<li>')).join('')}</ul>`;
                    }
                    return `<p>${listItems.join('<br>')}</p>`;
                } else {
                    return `<p>${paragraph.replace(/\\n/g, '<br>')}</p>`;
                }
            })
            .filter(p => p.trim())
            .join('');

        return formatted;
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <span>Analyzing your request...</span>
            <div class="loading-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `;
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    new SkinCareAI();

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });
});
