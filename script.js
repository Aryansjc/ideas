class TerminalCraftIdeaGenerator {
    constructor() {
        this.apiKey = null;
        this.generatedIdeas = new Set();
        this.sessionCount = 0;
        this.totalCount = this.loadTotalCount();
        this.initializeEventListeners();
        this.initializeLanguageControls();
        this.initializeProjectTypeControls();
        this.updateStats();
        this.loadApiKey();
    }
    initializeEventListeners() {
        const generateBtn = document.getElementById('generateBtn');
        const loading = document.getElementById('loading');
        generateBtn.addEventListener('click', async () => {
            if (!this.apiKey) {
                this.showError('API configuration missing. Please check server setup.');
                return;
            }
            const selectedLanguages = this.getSelectedLanguages();
            const projectType = this.getSelectedProjectType();
            const customIdea = this.getCustomIdea();
            if (selectedLanguages.length === 0) {
                this.showError('Please select at least one programming language.');
                return;
            }
            if (projectType === 'others' && !customIdea.trim()) {
                this.showError('Please describe your custom project idea.');
                return;
            }
            generateBtn.disabled = true;
            loading.style.display = 'block';
            try {
                await this.generateIdea(selectedLanguages, projectType, customIdea);
            } catch (error) {
                this.showError('Failed to craft idea. Please try again.');
                console.error('Error generating idea:', error);
            } finally {
                generateBtn.disabled = false;
                loading.style.display = 'none';
            }
        });
    }
    async loadApiKey() {
        this.apiKey = true; 
    }
    async generateIdea(selectedLanguages, projectType, customIdea) {
        try {
            const response = await fetch('/api/generate-idea', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    languages: selectedLanguages,
                    projectType: projectType,
                    customIdea: customIdea
                }),
            });
            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.success && data.idea) {
                this.displayIdea(data.idea);
                this.updateCounts();
            } else {
                throw new Error(data.error || 'Failed to craft idea');
            }
        } catch (error) {
            console.error('Failed to generate idea:', error);
            this.showError('Unable to generate idea. Please check your connection and try again.');
        }
    }
    parseTextResponse(content) {
        const lines = content.split('\n').filter(line => line.trim());
        return {
            name: `parsed-idea-${Date.now()}`,
            description: "A unique command-line tool with innovative features.",
            features: [
                "Solves real-world problems",
                "User-friendly interface",
                "Cross-platform compatibility", 
                "Self-contained design"
            ],
            audience: "Developers and power users",
            technologies: "Modern systems languages",
            tags: ["cli", "tool", "productivity", "innovation"]
        };
    }
    displayIdea(idea) {
        const container = document.getElementById('ideasContainer');
        const ideaCard = this.createIdeaCard(idea);
        container.insertBefore(ideaCard, container.firstChild);
        this.generatedIdeas.add(idea.name);
        const cards = container.children;
        if (cards.length > 10) {
            container.removeChild(cards[cards.length - 1]);
        }
    }
    createIdeaCard(idea) {
        const card = document.createElement('div');
        card.className = 'idea-card';
        const features = Array.isArray(idea.features) 
            ? idea.features.map(f => `<li>${f}</li>`).join('')
            : '<li>Core functionality implementation</li><li>User-friendly command interface</li><li>Cross-platform compatibility</li>';
        const tags = Array.isArray(idea.tags)
            ? idea.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
            : '<span class="tag">cli</span><span class="tag">tool</span>';
        card.innerHTML = `
            <div class="idea-header">
                <h3 class="idea-title">${idea.name}</h3>
                <span class="idea-number">#${this.totalCount + 1}</span>
            </div>
            <p class="idea-description">${idea.description}</p>
            <div class="idea-features">
                <h4>Core Features:</h4>
                <ul>${features}</ul>
            </div>
            <div class="idea-meta">
                <strong>Target Users:</strong> ${idea.audience || 'CLI enthusiasts and developers'}
            </div>
            <div class="idea-meta">
                <strong>Tech Stack:</strong> ${idea.technologies || 'Modern systems languages'}
            </div>
            <div class="idea-tags">${tags}</div>
        `;
        return card;
    }
    updateCounts() {
        this.sessionCount++;
        this.totalCount++;
        this.saveTotalCount();
        this.updateStats();
    }
    updateStats() {
        document.getElementById('sessionIdeas').textContent = this.sessionCount;
        document.getElementById('totalIdeas').textContent = this.totalCount;
    }
    loadTotalCount() {
        return parseInt(localStorage.getItem('terminalCraft_totalCount') || '0');
    }
    saveTotalCount() {
        localStorage.setItem('terminalCraft_totalCount', this.totalCount.toString());
    }
    showError(message) {
        const container = document.getElementById('ideasContainer');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        container.insertBefore(errorDiv, container.firstChild);
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
    getSelectedLanguages() {
        const checkboxes = document.querySelectorAll('input[name="language"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }
    getSelectedProjectType() {
        const radioButtons = document.querySelectorAll('input[name="projectType"]:checked');
        return radioButtons.length > 0 ? radioButtons[0].value : 'tools';
    }
    getCustomIdea() {
        const customIdeaInput = document.getElementById('customIdeaInput');
        return customIdeaInput ? customIdeaInput.value : '';
    }
    initializeLanguageControls() {
        const selectAllBtn = document.getElementById('selectAllBtn');
        const clearAllBtn = document.getElementById('clearAllBtn');
        const selectPopularBtn = document.getElementById('selectPopularBtn');
        selectAllBtn.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('input[name="language"]');
            checkboxes.forEach(cb => cb.checked = true);
        });
        clearAllBtn.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('input[name="language"]');
            checkboxes.forEach(cb => cb.checked = false);
        });
        selectPopularBtn.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('input[name="language"]');
            const popularLanguages = ['rust', 'go', 'python', 'cpp', 'zig'];
            checkboxes.forEach(cb => {
                cb.checked = popularLanguages.includes(cb.value);
            });
        });
    }
    initializeProjectTypeControls() {
        const projectTypeRadios = document.querySelectorAll('input[name="projectType"]');
        const customIdeaSection = document.getElementById('customIdeaSection');
        if (!customIdeaSection) {
            console.error('Custom idea section not found!');
            return;
        }
        projectTypeRadios.forEach((radio) => {
            radio.addEventListener('change', () => {
                if (radio.value === 'others' && radio.checked) {
                    customIdeaSection.style.display = 'block';
                } else {
                    customIdeaSection.style.display = 'none';
                }
            });
        });
        const checkedRadio = document.querySelector('input[name="projectType"]:checked');
        if (checkedRadio && checkedRadio.value === 'others') {
            customIdeaSection.style.display = 'block';
        }
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new TerminalCraftIdeaGenerator();
});
document.addEventListener('DOMContentLoaded', () => {
    const ruleCards = document.querySelectorAll('.rule-card');
    ruleCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px) scale(1.02)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
    document.documentElement.style.scrollBehavior = 'smooth';
});
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const generateBtn = document.getElementById('generateBtn');
        if (!generateBtn.disabled) {
            generateBtn.click();
        }
    }
});