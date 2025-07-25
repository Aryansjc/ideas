const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 1122;
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));
const generatedIdeas = new Set();
let fallbackCounter = 0;
app.post('/api/generate-idea', async (req, res) => {
    try {
        const { languages = ['rust', 'go'], projectType = 'tools', customIdea = '' } = req.body;
        const idea = await generateTerminalCraftIdea(languages, projectType, customIdea);
        res.json({ success: true, idea });
    } catch (error) {
        console.error('Error generating idea:', error);
        res.status(500).json({ success: false, error: 'Failed to craft project idea' });
    }
});
async function generateTerminalCraftIdea(languages, projectType = 'tools', customIdea = '') {
    const prompt = createTerminalCraftPrompt(languages, projectType, customIdea);
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-r1',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a creative software engineer helping with Terminal Craft challenge. Generate practical, unique CLI tool ideas that developers would actually want to use. Always respond with valid JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 1500
            })
        });
        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
        }
        const data = await response.json();
        const content = data.choices[0].message.content;
        try {
            const idea = JSON.parse(content);
            generatedIdeas.add(idea.name);
            return idea;
        } catch (e) {
            console.log('Failed to parse JSON, using fallback');
            return generateFallbackIdea(languages, projectType, customIdea);
        }
    } catch (error) {
        console.error('API call failed, using fallback:', error);
        fallbackCounter++;
        console.log(`Using fallback idea generation (count: ${fallbackCounter})`);
        return generateFallbackIdea(languages, projectType, customIdea);
    }
}
function createTerminalCraftPrompt(languages, projectType = 'tools', customIdea = '') {
    const existingIdeas = Array.from(generatedIdeas).join(', ');
    const languageList = languages.join(', ');
    const timestamp = Date.now();
    const randomSeed = Math.floor(Math.random() * 10000);
    if (projectType === 'others' && customIdea.trim()) {
        return `Transform the following user project idea into a detailed Terminal Craft roadmap that meets the challenge requirements:
USER PROJECT IDEA: "${customIdea}"
TERMINAL CRAFT REQUIREMENTS:
1. Build a terminal application that solves a real problem or provides entertainment
2. Must get at least 10 users to use and test the app
3. Must be open-source for others to learn from
4. Must support Unix platforms (Linux, macOS)
5. Must include screenshots or demos showing the app in action
6. The app must be self-contained — no reliance on pre-installed tools
7. Must provide clear, step-by-step instructions to build and run on all platforms
8. Do NOT remake an existing tool with only minor changes
9. Do NOT build just a wrapper around another tool
TECHNICAL CONSTRAINTS:
- Use primarily these languages: ${languageList}
- Should be feasible to build within 3-6 weeks of dedicated development (15+ hours minimum)
- Must have clear value proposition for terminal users
- Should leverage the strengths of the chosen programming languages
PROJECT SCOPE REQUIREMENTS:
- Must be substantial enough to require at least 15-20 hours of development time
- Should include multiple complex features and subsystems
- Require significant architecture design and implementation
- Include data persistence, configuration management, and error handling
- Have rich user interfaces with multiple interaction modes
- Support extensibility through plugins, scripting, or configuration
- Implement advanced algorithms or data processing capabilities
UNIQUENESS REQUIREMENT: 
- The refined idea must be completely different from these existing ideas: ${existingIdeas}
- Add unique features and approaches that haven't been explored
- Think creatively about solving the problem in novel ways
TASK: Transform the user's idea into a substantial Terminal Craft project by:
1. Refining the concept to fit terminal/CLI environment
2. Adding multiple complex features that make it engaging and useful
3. Ensuring it meets all Terminal Craft requirements including substantial scope
4. Making it technically feasible with the chosen languages
5. Adding unique elements that differentiate it from existing tools
6. Designing a project that requires significant development effort (15+ hours)
Please provide a JSON response with exactly these fields:
{
  "name": "short-project-name-${randomSeed} (lowercase, hyphens)",
  "description": "Comprehensive description (3-4 sentences explaining the refined concept, key features, and technical complexity)",
  "features": ["Complex Feature 1 with technical details", "Advanced Feature 2 with implementation notes", "Sophisticated Feature 3 with algorithms", "Comprehensive Feature 4 with integrations", "Additional Feature 5 for extensibility", "Performance Feature 6 for optimization"],
  "audience": "Target audience description",
  "technologies": "${languageList} with relevant libraries/frameworks for complex implementation",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"]
}
Make the refined idea specific, engaging, and something people would genuinely want to use.`;
    }
    let projectTypeFilter = '';
    let creativityPrompt = '';
    if (projectType === 'games') {
        projectTypeFilter = 'Focus on comprehensive interactive terminal experiences with multiple game modes, progression systems, and rich content. Think beyond simple games - create full-featured gaming platforms with save systems, multiplayer capabilities, modding support, tournaments, social features, or completely new forms of terminal entertainment that require substantial development effort.';
        creativityPrompt = 'Design complex gaming experiences that push the boundaries of terminal interfaces. Consider multi-layered gameplay systems, procedural content generation, AI opponents, networking capabilities, persistent world states, achievement systems, user-generated content, community features, and innovative mechanics that leverage the unique nature of command-line interfaces. Aim for projects requiring 15+ hours of development.';
    } else if (projectType === 'tools') {
        projectTypeFilter = 'Focus on comprehensive productivity solutions with multiple integrated subsystems, advanced algorithms, and extensive feature sets. Think beyond simple utilities - create powerful platforms with plugin architectures, advanced data processing, machine learning integration, API connectivity, configuration management, and sophisticated user interfaces that require substantial development effort.';
        creativityPrompt = 'Design complex tool ecosystems that solve significant problems through advanced technology. Consider distributed systems, real-time processing, intelligent automation, data analytics, visualization engines, integration with external services, extensible architectures, and innovative approaches to developer productivity. What comprehensive solutions could revolutionize workflows? Aim for projects requiring 15+ hours of development.';
    } else {
        projectTypeFilter = 'Consider comprehensive terminal applications that provide significant value through multiple integrated features, advanced functionality, and substantial technical complexity.';
        creativityPrompt = 'Design feature-rich applications that blend multiple domains with sophisticated implementations requiring substantial development effort (15+ hours).';
    }
    return `Generate a completely unique and innovative CLI project idea for the Terminal Craft challenge. Think outside the box and create something genuinely original.
GENERATION SEED: ${timestamp}-${randomSeed}
STRICT UNIQUENESS REQUIREMENT:
- The idea MUST be completely different from these existing ideas: ${existingIdeas}
- Do NOT create variations or similar concepts to existing ideas
- Think of completely new problem domains, innovative solutions, and creative approaches
- Be wildly creative and think beyond conventional CLI tools
TERMINAL CRAFT REQUIREMENTS:
1. Build a terminal application that solves a real problem or provides entertainment
2. Must get at least 10 users to use and test the app
3. Must be open-source for others to learn from
4. Must support Unix platforms (Linux, macOS)
5. Must include screenshots or demos showing the app in action
6. The app must be self-contained — no reliance on pre-installed tools
7. Must provide clear, step-by-step instructions to build and run on all platforms
8. Do NOT remake an existing tool with only minor changes
9. Do NOT build just a wrapper around another tool
TECHNICAL CONSTRAINTS:
- Use primarily these languages: ${languageList}
- Should be feasible to build within 3-6 weeks of dedicated development (15+ hours minimum)
- Must have clear value proposition for terminal users
- Should leverage the strengths of the chosen programming languages
- Include proper architecture design for complex systems
- Implement data persistence, configuration management, and error handling
- Support extensibility and maintainability for long-term development
PROJECT SCOPE REQUIREMENTS:
- Must be substantial enough to require at least 15-20 hours of development time
- Should include multiple complex features and subsystems working together
- Require significant architecture design and implementation planning
- Include comprehensive data management and state persistence
- Have rich, multi-modal user interfaces with advanced interaction patterns
- Support extensibility through plugins, scripting, APIs, or configuration systems
- Implement advanced algorithms, data processing, or AI capabilities
- Include proper testing frameworks, documentation, and deployment considerations
PROJECT TYPE: ${projectTypeFilter}
CREATIVE FREEDOM: ${creativityPrompt}
INNOVATION CHALLENGES:
- What problems haven't been solved in terminal environments?
- What new workflows could be enabled by CLI tools?
- How can you combine existing concepts in novel ways?
- What emerging technologies or trends could be applied to CLI?
- What user experiences are possible only in terminal environments?
- Think about unconventional domains: art, music, social, health, education, entertainment, productivity
EXAMPLES OF THINKING OUTSIDE THE BOX:
- CLI tools for creative domains (music composition, ASCII art generation, poetry)
- Social/collaborative terminal applications
- Educational/learning tools for the command line
- Health and wellness tracking via terminal
- Entertainment that goes beyond traditional games
- Productivity tools for new workflows and modern challenges
- Scientific/research tools for data analysis
- Creative coding and generative art tools
Please provide a JSON response with exactly these fields:
{
  "name": "innovative-project-name-${randomSeed} (lowercase, hyphens, must be unique and creative)",
  "description": "Comprehensive description (3-4 sentences explaining the innovative concept, technical complexity, key systems, and why it provides significant value requiring substantial development effort)",
  "features": ["Complex Core Feature 1 with technical implementation details", "Advanced Feature 2 with algorithms/data structures", "Sophisticated Feature 3 with integrations/APIs", "Comprehensive Feature 4 with user experience design", "Extensibility Feature 5 with plugin/scripting support", "Performance Feature 6 with optimization techniques"],
  "audience": "Specific target audience who would benefit from this substantial innovation",
  "technologies": "${languageList} with relevant libraries, frameworks, databases, and external services for complex implementation",
  "tags": ["creative-tag1", "innovative-tag2", "complex-tag3", "substantial-tag4", "advanced-tag5", "comprehensive-tag6"]
}
Ensure the project is complex enough to warrant 15+ hours of development time through multiple interconnected systems, advanced features, and sophisticated implementation requirements.`;
}
function generateFallbackIdea(languages = ['rust', 'go'], projectType = 'tools', customIdea = '') {
    const languageMap = {
        rust: "Rust", go: "Go", python: "Python", cpp: "C++", c: "C", zig: "Zig",
        nim: "Nim", crystal: "Crystal", deno: "Deno", kotlin: "Kotlin", dart: "Dart",
        julia: "Julia", haskell: "Haskell", ocaml: "OCaml", swift: "Swift", dlang: "D",
        vlang: "V", odin: "Odin", elixir: "Elixir", erlang: "Erlang"
    };
    const techStack = languages.map(lang => languageMap[lang] || lang).join(", ");
    if (projectType === 'others' && customIdea.trim()) {
        const timestamp = Date.now();
        const uniqueId = Math.floor(Math.random() * 10000);
        return {
            name: `custom-${uniqueId}-${timestamp % 10000}`,
            description: `Transform your idea: "${customIdea}" into a Terminal Craft project with innovative CLI features and cross-platform compatibility.`,
            features: [
                "Custom functionality tailored to user needs",
                "Terminal-optimized user interface design", 
                "Cross-platform compatibility (Linux/macOS)",
                "Self-contained with minimal dependencies"
            ],
            audience: "Users with specific project requirements",
            technologies: techStack,
            tags: ["custom", "user-defined", "cli", "terminal"]
        };
    }
    const timestamp = Date.now();
    const uniqueId = Math.floor(Math.random() * 100000);
    const randomSeed = Math.floor(Math.random() * 10000);
    if (projectType === 'games') {
        return generateGameIdea(techStack, uniqueId, timestamp);
    }
    const prefixes = ["quantum", "neural", "sonic", "stellar", "cosmic", "pixel", "cyber", "nano", "micro", "meta", "hyper", "ultra", "smart", "swift", "zen", "flux", "wave", "echo", "spark", "glow", "crystal", "shadow", "digital", "virtual", "atomic", "plasma", "matrix", "nexus", "prism", "vertex"];
    const actions = ["craft", "forge", "build", "create", "design", "compose", "generate", "analyze", "optimize", "enhance", "transform", "discover", "explore", "navigate", "track", "monitor", "stream", "sync", "blend", "merge", "decode", "encode", "parse", "compile", "render", "execute", "deploy", "simulate", "calibrate", "orchestrate"];
    const domains = ["terminal", "cli", "console", "shell", "workspace", "studio", "lab", "hub", "toolkit", "engine", "framework", "platform", "interface", "environment", "system", "network", "data", "code", "flow", "pipeline", "grid", "mesh", "cluster", "vault", "forge", "reactor", "chamber", "portal", "gateway", "bridge"];
    const concepts = ["efficiency", "innovation", "automation", "intelligence", "creativity", "productivity", "performance", "security", "reliability", "scalability", "versatility", "precision", "elegance", "simplicity", "robustness", "agility", "coherence", "synthesis", "harmony", "balance", "resonance", "momentum", "velocity", "trajectory", "amplitude", "frequency", "wavelength", "spectrum", "dimension", "paradigm"];
    const namePatterns = [
        () => `${prefixes[Math.floor(Math.random() * prefixes.length)]}-${actions[Math.floor(Math.random() * actions.length)]}-${uniqueId % 10000}`,
        () => `${actions[Math.floor(Math.random() * actions.length)]}-${domains[Math.floor(Math.random() * domains.length)]}-${Math.floor(Math.random() * 1000)}`,
        () => `${concepts[Math.floor(Math.random() * concepts.length)]}-${prefixes[Math.floor(Math.random() * prefixes.length)]}-${uniqueId % 1000}`,
        () => `${domains[Math.floor(Math.random() * domains.length)]}-${concepts[Math.floor(Math.random() * concepts.length)]}-${Math.floor(Math.random() * 10000)}`,
        () => `${prefixes[Math.floor(Math.random() * prefixes.length)]}${actions[Math.floor(Math.random() * actions.length)]}-${Math.floor(Math.random() * 100000)}`
    ];
    const patternIndex = Math.floor(Math.random() * namePatterns.length);
    let projectName = namePatterns[patternIndex]();
    let attempts = 0;
    while (generatedIdeas.has(projectName) && attempts < 200) {
        const randomPattern = namePatterns[Math.floor(Math.random() * namePatterns.length)];
        projectName = randomPattern();
        attempts++;
    }
    generatedIdeas.add(projectName);
    const toolDescriptionTemplates = [
        (prefix, action, domain, concept) => `A comprehensive ${prefix} CLI platform that ${action}s enterprise-grade development workflows through advanced ${concept}, intelligent ${domain} integration, real-time processing, and extensible plugin architecture. Features sophisticated data analytics, machine learning capabilities, and multi-tenant support for scalable deployment across diverse development environments.`,
        (prefix, action, domain, concept) => `An enterprise-level command-line ecosystem leveraging cutting-edge ${prefix} technology to ${action} complex ${domain} operations with enhanced ${concept}, distributed processing, API connectivity, and comprehensive monitoring. Includes advanced caching, intelligent automation, configuration management, and extensive customization options for professional development teams.`,
        (prefix, action, domain, concept) => `A sophisticated ${domain} orchestration platform that combines breakthrough ${prefix} algorithms with ${action} capabilities for superior ${concept}, multi-threaded processing, and intelligent resource management. Features comprehensive data persistence, advanced visualization, real-time collaboration tools, and extensive integration capabilities with external services and APIs.`,
        (prefix, action, domain, concept) => `An advanced terminal application that revolutionizes ${domain} processes by ${action}ing with ${prefix} precision, ${concept} optimization, machine learning integration, and intelligent automation. Includes comprehensive plugin architecture, advanced data processing pipelines, real-time monitoring, and sophisticated user experience design for professional workflows.`,
        (prefix, action, domain, concept) => `A next-generation ${concept}-driven development platform that ${action}s ${domain} environments through intelligent ${prefix} processing, distributed architecture, and comprehensive automation. Features advanced analytics, real-time collaboration, extensive customization, API connectivity, and sophisticated error handling for enterprise-scale implementations.`,
        (prefix, action, domain, concept) => `A powerful ${prefix} ecosystem designed to ${action} and optimize complex ${domain} operations through intelligent ${concept}, real-time processing, advanced data management, and comprehensive integration capabilities. Includes sophisticated monitoring, extensive plugin support, machine learning features, and advanced visualization for professional development environments.`,
        (prefix, action, domain, concept) => `A comprehensive ${prefix} development platform that revolutionizes ${domain} workflows through advanced ${concept} optimization, intelligent ${action} automation, distributed processing, and extensive customization. Features sophisticated data analytics, real-time collaboration tools, comprehensive API connectivity, and advanced plugin architecture for scalable enterprise deployment.`
    ];
    const selectedPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const selectedAction = actions[Math.floor(Math.random() * actions.length)];
    const selectedDomain = domains[Math.floor(Math.random() * domains.length)];
    const selectedConcept = concepts[Math.floor(Math.random() * concepts.length)];
    const toolFeatureTemplates = [
        (prefix, action, domain, concept) => [
            `Advanced ${prefix} processing engine with distributed architecture and parallel computing`,
            `Intelligent ${action} automation with machine learning and predictive analytics`,
            `Cross-platform ${domain} compatibility with comprehensive API integrations`,
            `Real-time ${concept} optimization with advanced caching and performance monitoring`,
            `Extensible plugin architecture with scripting support and custom workflows`,
            `Comprehensive data persistence with advanced querying and backup systems`
        ],
        (prefix, action, domain, concept) => [
            `Enterprise-grade ${domain} analysis system with AI-powered insights and reporting`,
            `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} powered ${action} workflows with collaborative features`,
            `Enhanced ${concept} monitoring with real-time dashboards and alerting`,
            `Seamless ${domain} integration with extensive third-party service connectivity`,
            `Advanced configuration management with environment-specific deployments`,
            `Sophisticated error handling and recovery with comprehensive logging systems`
        ],
        (prefix, action, domain, concept) => [
            `${concept.charAt(0).toUpperCase() + concept.slice(1)}-driven ${action} pipeline with automated testing and deployment`,
            `Advanced ${prefix} algorithms with machine learning and pattern recognition`,
            `${domain.charAt(0).toUpperCase() + domain.slice(1)} performance optimization with intelligent resource management`,
            `Comprehensive security framework with encryption and access control`,
            `Real-time collaboration tools with multi-user support and conflict resolution`,
            `Extensible data processing with custom transformations and advanced analytics`
        ],
        (prefix, action, domain, concept) => [
            `Multi-threaded ${action} processing with distributed computing and load balancing`,
            `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} cache optimization with intelligent prefetching and compression`,
            `Dynamic ${domain} configuration with hot-reloading and environment management`,
            `${concept.charAt(0).toUpperCase() + concept.slice(1)} metrics and analytics with advanced visualization and reporting`,
            `Comprehensive plugin ecosystem with marketplace and dependency management`,
            `Advanced workflow automation with custom scripting and event-driven processing`
        ]
    ];
    const toolAudienceTemplates = [
        (prefix, action, domain, concept) => `Developers and engineers working with ${domain} systems`,
        (prefix, action, domain, concept) => `${concept.charAt(0).toUpperCase() + concept.slice(1)} professionals and ${action} specialists`,
        (prefix, action, domain, concept) => `DevOps teams and ${domain} administrators`,
        (prefix, action, domain, concept) => `Software engineers focused on ${concept} and ${action} optimization`
    ];
    const toolTagCategories = [
        [selectedPrefix, selectedAction, "tool", "cli"],
        ["terminal", selectedDomain, selectedConcept, "developer"],
        [selectedAction, "automation", selectedDomain, "productivity"],
        ["cross-platform", selectedConcept, selectedPrefix, "opensource"]
    ];
    const toolDescIndex = Math.floor(Math.random() * toolDescriptionTemplates.length);
    const toolFeatIndex = Math.floor(Math.random() * toolFeatureTemplates.length);
    const toolAudIndex = Math.floor(Math.random() * toolAudienceTemplates.length);
    const toolTagIndex = Math.floor(Math.random() * toolTagCategories.length);
    const description = toolDescriptionTemplates[toolDescIndex](selectedPrefix, selectedAction, selectedDomain, selectedConcept);
    const features = toolFeatureTemplates[toolFeatIndex](selectedPrefix, selectedAction, selectedDomain, selectedConcept);
    const audience = toolAudienceTemplates[toolAudIndex](selectedPrefix, selectedAction, selectedDomain, selectedConcept);
    const tags = toolTagCategories[toolTagIndex];
    const toolIdea = {
        name: projectName,
        description: description,
        features: features,
        audience: audience,
        technologies: techStack,
        tags: tags
    };
    console.log(`Generated specialized tool idea: ${projectName} (${selectedPrefix}-${selectedAction}-${selectedDomain}-${selectedConcept}) - Total: ${generatedIdeas.size}`);
    return toolIdea;
}
function generateGameIdea(techStack, uniqueId, timestamp) {
    const gameThemes = ["space", "dungeon", "cyber", "fantasy", "noir", "steampunk", "apocalypse", "medieval", "futuristic", "mystical", "pirate", "western", "horror", "adventure", "mystery", "racing", "puzzle", "strategy", "survival", "exploration", "heist", "detective", "martial", "cosmic", "underground", "oceanic", "aerial", "dimensional", "temporal", "quantum"];
    const gameActions = ["battle", "explore", "survive", "escape", "conquer", "defend", "race", "hunt", "solve", "build", "craft", "trade", "negotiate", "infiltrate", "hack", "decode", "rescue", "protect", "discover", "collect", "compete", "duel", "quest", "navigate", "command", "strategize", "outwit", "chase", "evade", "master"];
    const gameElements = ["warriors", "robots", "creatures", "spells", "weapons", "artifacts", "treasures", "mysteries", "challenges", "puzzles", "enemies", "allies", "worlds", "dimensions", "territories", "kingdoms", "empires", "guilds", "factions", "legends", "prophecies", "secrets", "powers", "abilities", "technologies", "magics", "realms", "galaxies", "universes", "timelines"];
    const gameMechanics = ["turn-based", "real-time", "puzzle-solving", "resource-management", "card-based", "dice-rolling", "skill-based", "story-driven", "choice-making", "exploration-focused", "combat-heavy", "stealth-oriented", "strategy-based", "reflex-testing", "memory-challenging", "logic-demanding", "pattern-matching", "timing-critical", "risk-reward", "cooperative", "competitive", "narrative-rich", "procedural", "adaptive", "emergent"];
    const gameFeatures = ["procedural generation", "dynamic storytelling", "intelligent AI", "adaptive difficulty", "branching narratives", "emergent gameplay", "social mechanics", "progression systems", "customization options", "multiplayer modes", "leaderboards", "achievements", "save systems", "replay value", "easter eggs", "hidden content", "mod support", "cross-platform play", "spectator modes", "tournament systems"];
    const gameAesthetics = ["ASCII art", "Unicode graphics", "color schemes", "animations", "sound effects", "music integration", "visual effects", "atmospheric design", "minimalist interface", "retro styling", "modern aesthetics", "thematic consistency", "immersive environments", "dynamic backgrounds", "particle effects", "lighting systems", "weather effects", "day-night cycles", "seasonal changes", "mood enhancement"];
    const gameNamePatterns = [
        () => `${gameThemes[Math.floor(Math.random() * gameThemes.length)]}-${gameActions[Math.floor(Math.random() * gameActions.length)]}-${uniqueId % 10000}`,
        () => `terminal-${gameElements[Math.floor(Math.random() * gameElements.length)]}-${Math.floor(Math.random() * 1000)}`,
        () => `ascii-${gameThemes[Math.floor(Math.random() * gameThemes.length)]}-${gameMechanics[Math.floor(Math.random() * gameMechanics.length)].split('-')[0]}-${uniqueId % 1000}`,
        () => `${gameActions[Math.floor(Math.random() * gameActions.length)]}-quest-${Math.floor(Math.random() * 10000)}`,
        () => `${gameThemes[Math.floor(Math.random() * gameThemes.length)]}${gameActions[Math.floor(Math.random() * gameActions.length)]}-${Math.floor(Math.random() * 100000)}`,
        () => `${gameElements[Math.floor(Math.random() * gameElements.length)]}-${gameMechanics[Math.floor(Math.random() * gameMechanics.length)].split('-')[0]}-${uniqueId % 10000}`
    ];
    const gamePatternIndex = Math.floor(Math.random() * gameNamePatterns.length);
    let gameName = gameNamePatterns[gamePatternIndex]();
    let gameAttempts = 0;
    while (generatedIdeas.has(gameName) && gameAttempts < 200) {
        const randomPattern = gameNamePatterns[Math.floor(Math.random() * gameNamePatterns.length)];
        gameName = randomPattern();
        gameAttempts++;
    }
    generatedIdeas.add(gameName);
    const selectedTheme = gameThemes[Math.floor(Math.random() * gameThemes.length)];
    const selectedAction = gameActions[Math.floor(Math.random() * gameActions.length)];
    const selectedElement = gameElements[Math.floor(Math.random() * gameElements.length)];
    const selectedMechanic = gameMechanics[Math.floor(Math.random() * gameMechanics.length)];
    const selectedFeature = gameFeatures[Math.floor(Math.random() * gameFeatures.length)];
    const selectedAesthetic = gameAesthetics[Math.floor(Math.random() * gameAesthetics.length)];
    const gameDescTemplates = [
        (theme, action, element, mechanic, feature, aesthetic) => `A comprehensive ${theme} terminal gaming platform where players ${action} through vast procedurally generated worlds filled with ${element}, featuring sophisticated ${mechanic} gameplay systems, ${feature}, multiplayer networking, persistent character progression, and stunning ${aesthetic}. Includes comprehensive mod support, tournament systems, and social features for building gaming communities.`,
        (theme, action, element, mechanic, feature, aesthetic) => `An ambitious ASCII gaming ecosystem that combines rich ${theme} storytelling with complex ${action} mechanics, where ${element} come alive through advanced ${mechanic} design, innovative ${feature}, real-time multiplayer capabilities, and comprehensive ${aesthetic}. Features extensive character customization, guild systems, achievement frameworks, and user-generated content tools.`,
        (theme, action, element, mechanic, feature, aesthetic) => `A sophisticated command-line gaming experience that blends immersive ${theme} atmospheres with challenging ${action} gameplay, featuring dynamic ${element}, complex ${mechanic} systems enhanced by ${feature}, comprehensive save systems, and artistic ${aesthetic}. Includes advanced AI opponents, procedural content generation, social features, and extensive customization options.`,
        (theme, action, element, mechanic, feature, aesthetic) => `An extensive terminal gaming platform set in ${theme} universes where players must ${action} using sophisticated ${mechanic} strategies, encountering diverse ${element} through ${feature}, beautiful ${aesthetic}, and comprehensive progression systems. Features tournament modes, guild management, advanced statistics tracking, and extensive mod support for community-driven content.`,
        (theme, action, element, mechanic, feature, aesthetic) => `A comprehensive ${mechanic} gaming ecosystem that transports players to immersive ${theme} realms to ${action} against intelligent ${element}, featuring advanced ${feature}, stunning ${aesthetic}, multiplayer networking, and persistent world systems. Includes sophisticated character development, social features, tournament infrastructure, and extensive customization capabilities.`,
        (theme, action, element, mechanic, feature, aesthetic) => `An advanced ASCII gaming platform that combines deep ${theme} lore with complex ${action} gameplay, where ${element} interact through sophisticated ${mechanic} systems, innovative ${feature}, and immersive ${aesthetic}. Features comprehensive progression systems, guild management, real-time multiplayer, advanced statistics, and extensive mod support for long-term engagement.`,
        (theme, action, element, mechanic, feature, aesthetic) => `A feature-rich terminal gaming environment featuring expansive ${theme} worlds where players ${action} through challenging ${mechanic} encounters, discovering ${element} via advanced ${feature} and artistic ${aesthetic}. Includes comprehensive social systems, tournament infrastructure, character progression, mod support, and community-driven content creation tools.`,
        (theme, action, element, mechanic, feature, aesthetic) => `A comprehensive ${mechanic} gaming platform set in vast ${theme} universes, challenging players to ${action} while managing complex ${element} through innovative ${feature}, stunning ${aesthetic}, and sophisticated progression systems. Features multiplayer networking, guild systems, advanced statistics, tournament modes, and extensive customization for competitive and casual play.`
    ];
    const gameFeatureTemplates = [
        (theme, action, element, mechanic, feature, aesthetic) => [
            `Sophisticated ${mechanic} ${action} system with AI opponents and advanced strategy algorithms`,
            `Dynamic ${element} generation with ${feature} and procedural content creation`,
            `Immersive ${theme} world building with persistent environments and rich lore systems`,
            `Advanced ${aesthetic} rendering engine with real-time effects and customizable interfaces`,
            `Comprehensive multiplayer networking with tournaments, guilds, and social features`,
            `Extensive character progression with skill trees, equipment systems, and achievement frameworks`
        ],
        (theme, action, element, mechanic, feature, aesthetic) => [
            `Procedural ${theme} environment generation with ${feature} and intelligent world design`,
            `Interactive ${element} behavior system with advanced AI and emergent gameplay`,
            `Complex ${mechanic} ${action} mechanics with strategic depth and tactical options`,
            `Real-time ${aesthetic} and ${feature} with dynamic visual effects and atmospheric design`,
            `Comprehensive save system with multiple profiles and cloud synchronization`,
            `Advanced mod support with scripting APIs and community content creation tools`
        ],
        (theme, action, element, mechanic, feature, aesthetic) => [
            `Intelligent ${element} AI with ${feature} and sophisticated behavioral patterns`,
            `Rich ${theme} atmosphere and ${aesthetic} with immersive storytelling and world-building`,
            `Complex ${action} skill progression with branching paths and specialization systems`,
            `Advanced ${mechanic} challenge scaling with adaptive difficulty and personalized content`,
            `Comprehensive statistics tracking with detailed analytics and performance metrics`,
            `Extensive customization options with user preferences and accessibility features`
        ],
        (theme, action, element, mechanic, feature, aesthetic) => [
            `Epic ${theme} storylines and quests with branching narratives and multiple endings`,
            `Strategic ${element} management system with resource allocation and tactical planning`,
            `Sophisticated ${action} combo system with ${feature} and advanced timing mechanics`,
            `Customizable ${aesthetic} and interface with theme support and accessibility options`,
            `Advanced networking infrastructure with real-time multiplayer and spectator modes`,
            `Comprehensive tournament system with rankings, seasons, and competitive play features`
        ],
        (theme, action, element, mechanic, feature, aesthetic) => [
            `Multi-tier ${action} tournaments with seasonal play and competitive ranking systems`,
            `Expansive ${theme} artifact collection system with rare items and trading mechanics`,
            `Advanced ${mechanic} gameplay with ${element} and sophisticated interaction systems`,
            `Enhanced ${aesthetic} with ${feature} and dynamic environmental effects`,
            `Comprehensive guild system with collaborative features and shared progression`,
            `Extensive data persistence with backup systems and cross-platform synchronization`
        ]
    ];
    const gameAudienceTemplates = [
        (theme, action, element, mechanic) => `${theme.charAt(0).toUpperCase() + theme.slice(1)} gaming enthusiasts and ${action} game lovers`,
        (theme, action, element, mechanic) => `Players who enjoy ${mechanic} games and ${element} adventures`,
        (theme, action, element, mechanic) => `${action.charAt(0).toUpperCase() + action.slice(1)} game fans and terminal gaming communities`,
        (theme, action, element, mechanic) => `Retro gamers seeking ${theme} experiences and ${mechanic} challenges`,
        (theme, action, element, mechanic) => `ASCII game enthusiasts and ${element} collection fans`,
        (theme, action, element, mechanic) => `Strategic gamers interested in ${theme} worlds and ${action} mechanics`
    ];
    const gameTagCategories = [
        [selectedTheme, selectedAction, "game", "terminal"],
        ["ascii", selectedMechanic.split('-')[0], selectedElement, "gaming"],
        [selectedAction, "interactive", selectedTheme, "entertainment"],
        ["retro", selectedElement, selectedMechanic.split('-')[0], "adventure"],
        [selectedTheme, "strategy", selectedAction, "multiplayer"],
        ["terminal-game", selectedElement, selectedFeature.split(' ')[0], selectedTheme]
    ];
    const gameDescIndex = Math.floor(Math.random() * gameDescTemplates.length);
    const gameFeatIndex = Math.floor(Math.random() * gameFeatureTemplates.length);
    const gameAudIndex = Math.floor(Math.random() * gameAudienceTemplates.length);
    const gameTagIndex = Math.floor(Math.random() * gameTagCategories.length);
    const description = gameDescTemplates[gameDescIndex](selectedTheme, selectedAction, selectedElement, selectedMechanic, selectedFeature, selectedAesthetic);
    const features = gameFeatureTemplates[gameFeatIndex](selectedTheme, selectedAction, selectedElement, selectedMechanic, selectedFeature, selectedAesthetic);
    const audience = gameAudienceTemplates[gameAudIndex](selectedTheme, selectedAction, selectedElement, selectedMechanic);
    const tags = gameTagCategories[gameTagIndex];
    const gameIdea = {
        name: gameName,
        description: description,
        features: features,
        audience: audience,
        technologies: techStack,
        tags: tags
    };
    console.log(`Generated specialized game idea: ${gameName} (${selectedTheme}-${selectedAction}-${selectedElement}-${selectedMechanic}) - Total: ${generatedIdeas.size}`);
    return gameIdea;
}
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.listen(PORT, () => {
    console.log(`Terminal Craft Idea Generator running on http://localhost:${PORT}`);
    console.log('Make sure to set your OPENROUTER_API_KEY in the .env file');
    console.log('Ready to craft some amazing CLI projects!');
});
module.exports = app;