import { api } from '../api.js';
import { toast } from '../toast.js';

// Default initial Play Store Listing dataset tailored for this AI Prompt App
const DEFAULT_PLAYSTORE_DATA = {
  appName: 'PromptAI: Curated AI Prompts',
  shortDescription: 'Explore, copy & test 10,000+ top prompts for Midjourney, DALL-E, Sora & AI art.',
  longDescription: `🚀 Unlock the True Power of Artificial Intelligence with 10,000+ Curated AI Prompts!

Struggling with vague AI results, distorted fingers, or bland outputs? PromptAI is your ultimate creative companion for prompt engineering, generative art, and cinematic video creation. Explore thousands of hand-crafted, battle-tested prompts designed specifically for the world's most powerful AI engines.

Copy any prompt with a single tap, tweak the parameters, and generate jaw-dropping masterpieces in seconds!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ KEY HIGHLIGHTS & FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔥 10,000+ Curated & Tested AI Prompts
Never run out of creative ideas. Browse an ever-expanding, daily-updated library of photorealistic portraits, cyberpunk cities, anime characters, 3D renders, architectural concepts, logo designs, and abstract dreamscapes.

⚡ 1-Click Copy & Instant AI Launch
Tap to copy full prompt text including aspect ratios (--ar 16:9, --ar 9:16), version flags (--v 6.0), stylize values, and negative prompt weights. Launch your favorite AI tool directly from the app.

🎬 AI Video Reels & Motion Prompts
Step into the future of motion! Discover cinematic video generation prompts crafted for OpenAI Sora, Runway Gen-3, Luma Dream Machine, Pika Labs, and Kling AI. View animated video previews and camera motion settings (Pan, Orbit, Zoom, Drone shots).

🎨 30+ Creative Categories
• Photorealistic & Cinematic 8K
• Anime, Manga & Digital Illustration
• Cyberpunk, Sci-Fi & Neon Landscapes
• 3D Isometric & Game Assets (Unreal Engine 5 style)
• Fashion, Luxury & Studio Portraits
• Architecture, Interiors & Urban Planning
• Logos, Typography & Minimalist Vector Icons
• Fantasy, Mythological & Surrealist Art

🔍 Smart Search & Parameter Filters
Find the exact visual aesthetic you need. Filter prompts by AI generator model, aspect ratio, camera lens type, lighting mood, or artistic medium.

💖 Personal Favorites & Collections
Bookmark prompts to your personal offline vault. Organize inspiration by project, client, or visual style.

🌐 Synchronized Daily Feed
Enjoy fresh, curated inspiration rotated daily. Discover what prompt engineers and digital creators worldwide are buzzing about.

🌙 Dark Mode & Smooth Glassmorphic UI
Designed for creators with a sleek, distraction-free modern interface that feels intuitive, fluid, and battery-friendly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠️ SUPPORTED AI ENGINES & PLATFORMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Midjourney v5, v6 & Niji
• DALL-E 3 & ChatGPT Plus
• Stable Diffusion XL (SDXL) & Flux.1
• Leonardo AI & SeaArt
• OpenAI Sora & Runway Gen-3 Alpha
• Luma Dream Machine & Pika 2.0
• Adobe Firefly & Google Imagen

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 100% PRIVATE & CREATOR FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
No account required to explore and copy prompts. Your creative journey remains completely anonymous and private.

Elevate your AI art and prompt engineering skills today. Download PromptAI and start creating viral, museum-grade AI art in minutes!`,
  category: 'Art & Design',
  secondaryCategory: 'Productivity / Tools',
  contentRating: 'Everyone (Rated 3+)',
  developerEmail: 'support@aipromptapp.com',
  privacyPolicyUrl: 'https://aipromptapp.com/privacy',
  appIconUrl: '/admin/assets/playstore/app_icon_3.png',
  featureGraphicUrl: '/admin/assets/playstore/feature-graphic.jpg',
  screenshotsPhone: [
    {
      id: 'p1',
      title: '10,000+ Curated AI Prompts',
      subtitle: 'For Midjourney, DALL-E 3, SDXL & Flux',
      imageUrl: '/admin/assets/playstore/screenshot-phone-1.jpg',
      type: 'phone'
    },
    {
      id: 'p2',
      title: '1-Click Copy & Parameters',
      subtitle: 'Includes aspect ratio, version & negative weights',
      imageUrl: '',
      gradient: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
      headline: '1-CLICK COPY & INSTANT LAUNCH',
      badge: 'PROMPT INSPECTOR',
      promptText: 'Cinematic wide shot of a futuristic neon city street in heavy rain, reflections of glowing holographic billboards, cybernetic woman in trench coat, photorealistic, 8k, Unreal Engine 5 --ar 16:9 --v 6.0',
      tags: ['Midjourney v6', '16:9', 'Cinematic'],
      type: 'phone'
    },
    {
      id: 'p3',
      title: 'AI Video Reels & Motion Prompts',
      subtitle: 'Camera motions for Sora, Runway & Luma',
      imageUrl: '',
      gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      headline: 'CINEMATIC AI VIDEO PROMPTS',
      badge: 'MOTION REELS',
      promptText: 'FPV drone dive through a glowing crystal canyon into a subterranean cyberpunk oasis, volumetric bioluminescence, motion blur, hyper-smooth 60fps cinematic camera',
      tags: ['Sora', 'Runway Gen-3', 'Camera: Orbit'],
      type: 'phone'
    },
    {
      id: 'p4',
      title: '30+ Curated Style Categories',
      subtitle: 'Anime, Photorealism, Cyberpunk, 3D & Architecture',
      imageUrl: '',
      gradient: 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)',
      headline: 'EXPLORE 30+ ART CATEGORIES',
      badge: 'CATEGORIES & STYLES',
      promptText: 'Anime style mechanical dragon coiled around a floating Tokyo skyscraper at sunset, Makoto Shinkai aesthetic, vibrant clouds, golden hour lighting --niji 6',
      tags: ['Anime', 'Niji 6', 'Fantasy'],
      type: 'phone'
    },
    {
      id: 'p5',
      title: 'Smart Search & Aspect Filters',
      subtitle: 'Instantly find the exact visual style and ratio',
      imageUrl: '',
      gradient: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
      headline: 'SMART SEARCH & DEEP FILTERS',
      badge: 'FILTER BY TOOL',
      promptText: 'Isometric 3D diorama of a cozy hacker workspace with glowing holographic screens and bonsai tree, clean clay render, ambient occlusion, pastel cyberpunk palette',
      tags: ['3D Isometric', 'DALL-E 3', 'Square 1:1'],
      type: 'phone'
    }
  ],
  screenshotsTablet: [
    {
      id: 't1',
      title: 'Tablet Dual-Pane Inspiration Grid',
      subtitle: 'Expansive multi-column feed & split-screen prompt inspector',
      gradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      headline: 'EXPANSIVE TABLET DUAL-PANE WORKSPACE',
      badge: 'TABLET 7" & 10"',
      type: 'tablet'
    },
    {
      id: 't2',
      title: 'Tablet Video & Studio Mode',
      subtitle: 'Side-by-side prompt testing with live motion parameters',
      gradient: 'linear-gradient(135deg, #1e102f 0%, #090e1f 100%)',
      headline: 'STUDIO MODE WITH MOTION PARAMETERS',
      badge: 'TABLET 10" PRO',
      type: 'tablet'
    }
  ]
};

// Alternative ASO copy presets for instant switching
const ASO_PRESETS = {
  balanced: {
    name: 'Curated & All-in-One (Recommended)',
    appName: 'PromptAI: Curated AI Prompts',
    shortDescription: 'Explore, copy & test 10,000+ top prompts for Midjourney, DALL-E, Sora & AI art.'
  },
  videoAndArt: {
    name: 'Video & Art Creator Focus',
    appName: 'Prompt Genius: AI Art & Video',
    shortDescription: 'Discover curated AI prompts for Midjourney, ChatGPT, Sora, Leonardo & DALL-E 3.'
  },
  promptEngineer: {
    name: 'Prompt Engineering & High-Converting',
    appName: 'AI Prompt Studio & Inspiration',
    shortDescription: 'Supercharge your AI art! Copy high-converting prompts for images & video in 1s.'
  }
};

export async function renderStoreListing(container) {
  let activeTab = 'metadata'; // 'metadata' | 'graphics' | 'screenshots-phone' | 'screenshots-tablet' | 'simulator'
  let listingData = JSON.parse(JSON.stringify(DEFAULT_PLAYSTORE_DATA));

  // Attempt to fetch saved playstore listing from backend remote config
  try {
    const res = await api.getAppConfig();
    const settings = res.data || [];
    const savedSetting = settings.find((s) => s.key === 'playstore_listing_data');
    if (savedSetting && savedSetting.value) {
      try {
        const parsed = JSON.parse(savedSetting.value);
        listingData = { ...listingData, ...parsed };
      } catch (e) {
        console.warn('Could not parse saved playstore_listing_data JSON', e);
      }
    }
  } catch (err) {
    console.warn('Could not load app settings, using default dataset', err);
  }

  function renderView() {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: var(--radius-lg); padding: 24px 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; box-shadow: 0 10px 30px -10px rgba(99, 102, 241, 0.25);">
          <div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
              <div style="background: linear-gradient(135deg, #10b981, #06b6d4); color: white; border-radius: 10px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);">
                <i data-lucide="play" style="width: 20px; height: 20px; fill: white;"></i>
              </div>
              <h1 class="page-header-title" style="margin: 0; font-size: 1.6rem;">Google Play Store Listing Details & ASO Hub</h1>
              <span class="badge badge-success" style="font-size: 0.75rem; letter-spacing: 0.05em;">READY FOR PLAY CONSOLE</span>
            </div>
            <p style="color: #94a3b8; font-size: 0.88rem; margin: 0; max-width: 780px; line-height: 1.5;">
              Production-ready Play Store metadata, 512×512 App Icon, 1024×500 Feature Graphic, Phone & Tablet Screenshots, and Google Play compliant Short/Long descriptions.
            </p>
          </div>

          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" id="btn-copy-all-metadata" title="Copy all listing text to clipboard formatted for Play Console">
              <i data-lucide="copy" style="width: 15px; height: 15px;"></i> Copy All Details
            </button>
            <button class="btn btn-secondary btn-sm" id="btn-export-json" title="Download metadata JSON manifest">
              <i data-lucide="download" style="width: 15px; height: 15px;"></i> Export JSON
            </button>
            <button class="btn btn-primary btn-sm" id="btn-save-to-backend" style="background: linear-gradient(135deg, #6366f1, #06b6d4); border: none;">
              <i data-lucide="save" style="width: 15px; height: 15px;"></i> Save Changes
            </button>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div style="display: flex; gap: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 4px; overflow-x: auto;">
          <button class="store-tab-btn ${activeTab === 'metadata' ? 'active' : ''}" data-tab="metadata">
            <i data-lucide="file-text" style="width: 16px; height: 16px;"></i>
            <span>1. Store Text & Descriptions</span>
          </button>
          <button class="store-tab-btn ${activeTab === 'graphics' ? 'active' : ''}" data-tab="graphics">
            <i data-lucide="image" style="width: 16px; height: 16px;"></i>
            <span>2. App Icon & Feature Graphic</span>
          </button>
          <button class="store-tab-btn ${activeTab === 'screenshots-phone' ? 'active' : ''}" data-tab="screenshots-phone">
            <i data-lucide="smartphone" style="width: 16px; height: 16px;"></i>
            <span>3. Phone Screenshots (9:16)</span>
            <span class="badge badge-secondary" style="font-size: 0.7rem; padding: 1px 6px;">5 Cards</span>
          </button>
          <button class="store-tab-btn ${activeTab === 'screenshots-tablet' ? 'active' : ''}" data-tab="screenshots-tablet">
            <i data-lucide="tablet" style="width: 16px; height: 16px;"></i>
            <span>4. Tablet Screenshots (7" & 10")</span>
          </button>
          <button class="store-tab-btn ${activeTab === 'simulator' ? 'active' : ''}" data-tab="simulator">
            <i data-lucide="eye" style="width: 16px; height: 16px;"></i>
            <span>5. Live Play Store Simulator</span>
            <span class="badge badge-success" style="font-size: 0.7rem; padding: 1px 6px;">Interactive</span>
          </button>
        </div>

        <!-- Tab Content Area -->
        <div id="store-tab-content"></div>

      </div>
    `;

    renderActiveTabContent();
    setupGlobalEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  function renderActiveTabContent() {
    const tabContent = container.querySelector('#store-tab-content');
    if (!tabContent) return;

    if (activeTab === 'metadata') {
      tabContent.innerHTML = renderMetadataTab();
      setupMetadataTabEvents();
    } else if (activeTab === 'graphics') {
      tabContent.innerHTML = renderGraphicsTab();
      setupGraphicsTabEvents();
    } else if (activeTab === 'screenshots-phone') {
      tabContent.innerHTML = renderPhoneScreenshotsTab();
      setupPhoneScreenshotsTabEvents();
    } else if (activeTab === 'screenshots-tablet') {
      tabContent.innerHTML = renderTabletScreenshotsTab();
      setupTabletScreenshotsTabEvents();
    } else if (activeTab === 'simulator') {
      tabContent.innerHTML = renderSimulatorTab();
      setupSimulatorTabEvents();
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // =========================================================================
  // TAB 1: METADATA & DESCRIPTIONS
  // =========================================================================
  function renderMetadataTab() {
    const appNameLen = listingData.appName.length;
    const shortDescLen = listingData.shortDescription.length;
    const longDescLen = listingData.longDescription.length;

    return `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- ASO Quick Presets Bar -->
        <div class="card" style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08);">
          <div class="card-body" style="padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <i data-lucide="sparkles" style="color: #a855f7; width: 18px; height: 18px;"></i>
              <span style="font-size: 0.9rem; font-weight: 600; color: #fff;">Quick ASO Optimization Presets:</span>
              <span style="font-size: 0.8rem; color: #94a3b8;">Switch between pre-tested high-ranking title & short description pairs</span>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${Object.entries(ASO_PRESETS)
                .map(
                  ([key, preset]) => `
                <button class="btn btn-secondary btn-sm aso-preset-btn" data-preset="${key}">
                  ${preset.name}
                </button>
              `
                )
                .join('')}
            </div>
          </div>
        </div>

        <!-- App Name / Title (Max 30 chars) -->
        <div class="card">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <div class="card-title" style="display: flex; align-items: center; gap: 8px;">
              <i data-lucide="tag" style="color: #6366f1;"></i>
              App Name (Play Console Title)
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span id="app-name-counter" class="char-pill ${appNameLen <= 30 ? 'char-pill-ok' : 'char-pill-error'}">
                ${appNameLen} / 30 chars
              </span>
              <button class="btn btn-secondary btn-sm copy-btn" data-target="input-app-name">
                <i data-lucide="copy" style="width: 14px; height: 14px;"></i> Copy
              </button>
            </div>
          </div>
          <div class="card-body">
            <p style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 10px;">
              Google Play policy enforces a strict maximum of <strong>30 characters</strong>. Avoid terms like "free", "#1", "top", or ALL-CAPS spam.
            </p>
            <input type="text" id="input-app-name" class="input-text" maxlength="35" value="${escapeHtml(listingData.appName)}" style="font-size: 1.05rem; font-weight: 600; font-family: 'Outfit', sans-serif;" />
          </div>
        </div>

        <!-- Short Description (Max 80 chars) -->
        <div class="card">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <div class="card-title" style="display: flex; align-items: center; gap: 8px;">
              <i data-lucide="align-left" style="color: #06b6d4;"></i>
              Short Description (Play Console Short Description)
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span id="short-desc-counter" class="char-pill ${shortDescLen <= 80 ? 'char-pill-ok' : 'char-pill-error'}">
                ${shortDescLen} / 80 chars
              </span>
              <button class="btn btn-secondary btn-sm copy-btn" data-target="input-short-desc">
                <i data-lucide="copy" style="width: 14px; height: 14px;"></i> Copy
              </button>
            </div>
          </div>
          <div class="card-body">
            <p style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 10px;">
              First thing users see beneath the screenshot carousel on Google Play. Must hook the user in <strong>80 characters</strong> or less.
            </p>
            <textarea id="input-short-desc" class="input-textarea" rows="2" maxlength="90" style="font-size: 0.95rem; line-height: 1.5;">${escapeHtml(listingData.shortDescription)}</textarea>
          </div>
        </div>

        <!-- Long Description (Max 4000 chars) -->
        <div class="card">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div class="card-title" style="display: flex; align-items: center; gap: 8px;">
              <i data-lucide="file-text" style="color: #10b981;"></i>
              Full Description (Play Console Full Description)
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span id="long-desc-counter" class="char-pill ${longDescLen <= 4000 ? 'char-pill-ok' : 'char-pill-error'}">
                ${longDescLen.toLocaleString()} / 4,000 chars
              </span>
              <button class="btn btn-secondary btn-sm copy-btn" data-target="input-long-desc">
                <i data-lucide="copy" style="width: 14px; height: 14px;"></i> Copy Full Text
              </button>
            </div>
          </div>
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
              <p style="font-size: 0.8rem; color: #94a3b8; margin: 0;">
                Formatted with clean unicode dividers, feature bullets, keywords for Midjourney, DALL-E, Sora, SDXL, and Leonardo. Max 4,000 characters.
              </p>
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-secondary btn-sm" id="btn-desc-format-bullets" style="padding: 4px 10px; font-size: 0.78rem;">
                  ✨ Insert Bullets
                </button>
                <button class="btn btn-secondary btn-sm" id="btn-desc-reset-default" style="padding: 4px 10px; font-size: 0.78rem;">
                  <i data-lucide="rotate-ccw" style="width: 12px; height: 12px;"></i> Reset Default
                </button>
              </div>
            </div>
            <textarea id="input-long-desc" class="input-textarea" rows="18" maxlength="4500" style="font-size: 0.88rem; line-height: 1.6; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">${escapeHtml(listingData.longDescription)}</textarea>
          </div>
        </div>

        <!-- Categorization & Contact Metadata -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
          
          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <i data-lucide="layers" style="color: #f59e0b;"></i>
                Play Store Categorization & Rating
              </div>
            </div>
            <div class="card-body" style="display: flex; flex-direction: column; gap: 14px;">
              <div>
                <label class="form-label">Primary Category</label>
                <input type="text" id="input-category" class="input-text" value="${escapeHtml(listingData.category)}" />
                <span style="font-size: 0.72rem; color: #64748b;">Recommended: Art & Design (Highest conversion for AI art & prompt tools)</span>
              </div>
              <div>
                <label class="form-label">Secondary Category / Tags</label>
                <input type="text" id="input-sec-category" class="input-text" value="${escapeHtml(listingData.secondaryCategory)}" />
              </div>
              <div>
                <label class="form-label">Content Rating</label>
                <input type="text" id="input-content-rating" class="input-text" value="${escapeHtml(listingData.contentRating)}" />
                <span style="font-size: 0.72rem; color: #64748b;">Compliant rating via Google Play IARC questionnaire</span>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <i data-lucide="mail" style="color: #ec4899;"></i>
                Developer Contact & Store Links
              </div>
            </div>
            <div class="card-body" style="display: flex; flex-direction: column; gap: 14px;">
              <div>
                <label class="form-label">Support Email (Public on Store)</label>
                <input type="email" id="input-dev-email" class="input-text" value="${escapeHtml(listingData.developerEmail)}" />
              </div>
              <div>
                <label class="form-label">Privacy Policy URL (Mandatory)</label>
                <input type="url" id="input-privacy-url" class="input-text" value="${escapeHtml(listingData.privacyPolicyUrl)}" />
              </div>
              <div>
                <label class="form-label">Target Audience</label>
                <div style="font-size: 0.85rem; color: #cbd5e1; background: rgba(0,0,0,0.25); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.06);">
                  Digital Artists, Designers, Prompt Engineers, Content Creators (18+)
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  function setupMetadataTabEvents() {
    const appNameInput = container.querySelector('#input-app-name');
    const appNameCounter = container.querySelector('#app-name-counter');
    const shortDescInput = container.querySelector('#input-short-desc');
    const shortDescCounter = container.querySelector('#short-desc-counter');
    const longDescInput = container.querySelector('#input-long-desc');
    const longDescCounter = container.querySelector('#long-desc-counter');

    // Live counter for App Name
    appNameInput?.addEventListener('input', (e) => {
      listingData.appName = e.target.value;
      const len = listingData.appName.length;
      appNameCounter.textContent = `${len} / 30 chars`;
      appNameCounter.className = `char-pill ${len <= 30 ? 'char-pill-ok' : 'char-pill-error'}`;
    });

    // Live counter for Short Description
    shortDescInput?.addEventListener('input', (e) => {
      listingData.shortDescription = e.target.value;
      const len = listingData.shortDescription.length;
      shortDescCounter.textContent = `${len} / 80 chars`;
      shortDescCounter.className = `char-pill ${len <= 80 ? 'char-pill-ok' : 'char-pill-error'}`;
    });

    // Live counter for Long Description
    longDescInput?.addEventListener('input', (e) => {
      listingData.longDescription = e.target.value;
      const len = listingData.longDescription.length;
      longDescCounter.textContent = `${len.toLocaleString()} / 4,000 chars`;
      longDescCounter.className = `char-pill ${len <= 4000 ? 'char-pill-ok' : 'char-pill-error'}`;
    });

    // Other inputs
    container.querySelector('#input-category')?.addEventListener('input', (e) => {
      listingData.category = e.target.value;
    });
    container.querySelector('#input-sec-category')?.addEventListener('input', (e) => {
      listingData.secondaryCategory = e.target.value;
    });
    container.querySelector('#input-content-rating')?.addEventListener('input', (e) => {
      listingData.contentRating = e.target.value;
    });
    container.querySelector('#input-dev-email')?.addEventListener('input', (e) => {
      listingData.developerEmail = e.target.value;
    });
    container.querySelector('#input-privacy-url')?.addEventListener('input', (e) => {
      listingData.privacyPolicyUrl = e.target.value;
    });

    // Copy buttons
    container.querySelectorAll('.copy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = container.querySelector(`#${targetId}`);
        if (input) {
          navigator.clipboard.writeText(input.value);
          toast.success('Copied to clipboard!');
        }
      });
    });

    // ASO Preset Buttons
    container.querySelectorAll('.aso-preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const presetKey = btn.getAttribute('data-preset');
        const preset = ASO_PRESETS[presetKey];
        if (preset) {
          listingData.appName = preset.appName;
          listingData.shortDescription = preset.shortDescription;
          appNameInput.value = preset.appName;
          shortDescInput.value = preset.shortDescription;

          // update counters
          appNameInput.dispatchEvent(new Event('input'));
          shortDescInput.dispatchEvent(new Event('input'));
          toast.success(`Applied preset: ${preset.name}`);
        }
      });
    });

    // Reset default long description
    container.querySelector('#btn-desc-reset-default')?.addEventListener('click', () => {
      listingData.longDescription = DEFAULT_PLAYSTORE_DATA.longDescription;
      longDescInput.value = listingData.longDescription;
      longDescInput.dispatchEvent(new Event('input'));
      toast.info('Reset to default curated description');
    });

    // Insert bullets helper
    container.querySelector('#btn-desc-format-bullets')?.addEventListener('click', () => {
      const extraBullets = `\n• 🔥 High-converting prompt templates\n• ⚡ One-touch clipboard copy\n• 🎬 Motion camera prompt presets\n`;
      listingData.longDescription += extraBullets;
      longDescInput.value = listingData.longDescription;
      longDescInput.dispatchEvent(new Event('input'));
      toast.info('Added bullet points');
    });
  }

  // =========================================================================
  // TAB 2: APP ICON & FEATURE GRAPHIC
  // =========================================================================
  function renderGraphicsTab() {
    return `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- App Icon Section (512x512) -->
        <div class="card">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>
              <div class="card-title" style="display: flex; align-items: center; gap: 8px;">
                <i data-lucide="shield" style="color: #6366f1;"></i>
                High-Resolution App Icon (512 × 512 px)
              </div>
              <p style="font-size: 0.8rem; color: #94a3b8; margin: 4px 0 0 0;">
                Official Google Play Console Requirement: 32-bit PNG with alpha, exactly 512 × 512 pixels, maximum 1024 KB.
              </p>
            </div>
            <div style="display: flex; gap: 8px;">
              <a href="${listingData.appIconUrl}" download="playstore_icon_512x512.jpg" class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #6366f1, #06b6d4); border: none;">
                <i data-lucide="download" style="width: 14px; height: 14px;"></i> Download 512px Icon
              </a>
              <button class="btn btn-secondary btn-sm" id="btn-copy-icon-url">
                <i data-lucide="link" style="width: 14px; height: 14px;"></i> Copy URL
              </button>
            </div>
          </div>
          <div class="card-body">
            <div style="display: flex; gap: 32px; align-items: center; flex-wrap: wrap;">
              
              <!-- Icon Preview Frame -->
              <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                <div id="icon-preview-box" class="icon-squircle" style="width: 180px; height: 180px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.4); border: 1px solid rgba(255, 255, 255, 0.15); transition: border-radius 0.25s ease;">
                  <img src="${listingData.appIconUrl}" id="img-app-icon-preview" alt="Play Store App Icon" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/admin/assets/playstore/app_icon_3.png'" />
                </div>
                <!-- Shape preview mask toggle -->
                <div style="display: flex; gap: 6px; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.06);">
                  <button class="mask-toggle-btn active" data-mask="squircle" title="Google Play Squircle Mask">Squircle</button>
                  <button class="mask-toggle-btn" data-mask="rounded" title="Rounded Corner">Rounded</button>
                  <button class="mask-toggle-btn" data-mask="square" title="Raw Square PNG">Raw Square</button>
                </div>
              </div>

              <!-- Icon Details & Specs -->
              <div style="flex: 1; min-width: 280px; display: flex; flex-direction: column; gap: 14px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
                  <div style="background: rgba(15, 23, 42, 0.6); padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase;">Dimensions</div>
                    <div style="font-size: 1rem; font-weight: 700; color: #fff;">512 × 512 px</div>
                  </div>
                  <div style="background: rgba(15, 23, 42, 0.6); padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase;">Color Space & Format</div>
                    <div style="font-size: 1rem; font-weight: 700; color: #10b981;">32-bit PNG / JPG</div>
                  </div>
                  <div style="background: rgba(15, 23, 42, 0.6); padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase;">Design Motif</div>
                    <div style="font-size: 1rem; font-weight: 700; color: #38bdf8;">Holographic Prism Spark</div>
                  </div>
                </div>

                <div>
                  <label class="form-label">Custom App Icon URL</label>
                  <div style="display: flex; gap: 10px;">
                    <input type="text" id="input-app-icon-url" class="input-text" value="${escapeHtml(listingData.appIconUrl)}" placeholder="Enter custom 512x512 icon URL..." />
                    <button class="btn btn-secondary" id="btn-update-icon-url">Apply</button>
                  </div>
                </div>

                <div style="font-size: 0.78rem; color: #94a3b8; line-height: 1.5; background: rgba(99, 102, 241, 0.08); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid rgba(99, 102, 241, 0.2);">
                  💡 <strong>Google Play Design Note:</strong> Google Play automatically applies the official 20% squircle corner radius and drop shadow dynamically in the Play Store app. Upload the full square icon.
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Feature Graphic Section (1024x500) -->
        <div class="card">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>
              <div class="card-title" style="display: flex; align-items: center; gap: 8px;">
                <i data-lucide="presentation" style="color: #06b6d4;"></i>
                Feature Graphic Banner (1024 × 500 px)
              </div>
              <p style="font-size: 0.8rem; color: #94a3b8; margin: 4px 0 0 0;">
                Official Google Play Console Requirement: JPEG or 24-bit PNG (no alpha), exactly 1024 × 500 pixels, up to 15MB.
              </p>
            </div>
            <div style="display: flex; gap: 8px;">
              <a href="${listingData.featureGraphicUrl}" download="playstore_feature_graphic_1024x500.jpg" class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #06b6d4, #10b981); border: none;">
                <i data-lucide="download" style="width: 14px; height: 14px;"></i> Download 1024x500 Graphic
              </a>
              <button class="btn btn-secondary btn-sm" id="btn-copy-feature-url">
                <i data-lucide="link" style="width: 14px; height: 14px;"></i> Copy URL
              </button>
            </div>
          </div>
          <div class="card-body" style="display: flex; flex-direction: column; gap: 16px;">
            
            <!-- Graphic Preview -->
            <div style="width: 100%; max-width: 900px; aspect-ratio: 1024 / 500; border-radius: var(--radius-md); overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5); position: relative;">
              <img src="${listingData.featureGraphicUrl}" id="img-feature-graphic-preview" alt="Feature Graphic Banner" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/admin/assets/playstore/feature-graphic.jpg'" />
              
              <div style="position: absolute; bottom: 12px; right: 12px; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(8px); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; color: #fff; font-weight: 600; border: 1px solid rgba(255,255,255,0.15);">
                1024 × 500 px
              </div>
            </div>

            <div>
              <label class="form-label">Custom Feature Graphic URL</label>
              <div style="display: flex; gap: 10px; max-width: 800px;">
                <input type="text" id="input-feature-graphic-url" class="input-text" value="${escapeHtml(listingData.featureGraphicUrl)}" placeholder="Enter custom 1024x500 banner URL..." />
                <button class="btn btn-secondary" id="btn-update-feature-url">Apply</button>
              </div>
            </div>

            <div style="font-size: 0.78rem; color: #94a3b8; line-height: 1.5; background: rgba(6, 182, 212, 0.08); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid rgba(6, 182, 212, 0.2); max-width: 900px;">
              📌 <strong>Safe Zone Tip:</strong> Critical branding elements and logos are centered. Google Play Console recommends keeping text at least 15% away from borders to avoid clipping on smaller phone displays.
            </div>

          </div>
        </div>

      </div>
    `;
  }

  function setupGraphicsTabEvents() {
    // App icon shape mask toggles
    const iconBox = container.querySelector('#icon-preview-box');
    container.querySelectorAll('.mask-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.mask-toggle-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mask = btn.getAttribute('data-mask');
        if (iconBox) {
          if (mask === 'squircle') {
            iconBox.style.borderRadius = '38px';
          } else if (mask === 'rounded') {
            iconBox.style.borderRadius = '20px';
          } else {
            iconBox.style.borderRadius = '4px';
          }
        }
      });
    });

    // Custom Icon URL
    container.querySelector('#btn-update-icon-url')?.addEventListener('click', () => {
      const input = container.querySelector('#input-app-icon-url');
      if (input && input.value.trim()) {
        listingData.appIconUrl = input.value.trim();
        const img = container.querySelector('#img-app-icon-preview');
        if (img) img.src = listingData.appIconUrl;
        toast.success('App icon preview updated');
      }
    });

    // Copy icon URL
    container.querySelector('#btn-copy-icon-url')?.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.origin + listingData.appIconUrl);
      toast.success('App Icon URL copied to clipboard');
    });

    // Custom Feature Graphic URL
    container.querySelector('#btn-update-feature-url')?.addEventListener('click', () => {
      const input = container.querySelector('#input-feature-graphic-url');
      if (input && input.value.trim()) {
        listingData.featureGraphicUrl = input.value.trim();
        const img = container.querySelector('#img-feature-graphic-preview');
        if (img) img.src = listingData.featureGraphicUrl;
        toast.success('Feature Graphic preview updated');
      }
    });

    // Copy feature graphic URL
    container.querySelector('#btn-copy-feature-url')?.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.origin + listingData.featureGraphicUrl);
      toast.success('Feature Graphic URL copied to clipboard');
    });
  }

  // =========================================================================
  // TAB 3: PHONE SCREENSHOTS (9:16)
  // =========================================================================
  function renderPhoneScreenshotsTab() {
    return `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Screenshot Guidelines Card -->
        <div class="card" style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08);">
          <div class="card-body" style="padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #fff; font-size: 0.95rem;">
                <i data-lucide="smartphone" style="color: #6366f1;"></i>
                Phone Screenshots Specification & Marketing Set
              </div>
              <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">
                Google Play requires a minimum of <strong>4 screenshots</strong> (maximum 8), 16:9 or 9:16 aspect ratio (recommended 1080 × 2400 or 1080 × 1920 px).
              </div>
            </div>
            <div style="display: flex; gap: 10px;">
              <button class="btn btn-secondary btn-sm" id="btn-download-all-phone-ss">
                <i data-lucide="download-cloud" style="width: 14px; height: 14px;"></i> Download All 5 Mockups
              </button>
            </div>
          </div>
        </div>

        <!-- Phone Screenshots Gallery Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;">
          ${listingData.screenshotsPhone
            .map((ss, idx) => {
              const hasCustomImg = ss.imageUrl && ss.imageUrl.trim().length > 0;
              return `
              <div class="card screenshot-card" style="overflow: hidden; display: flex; flex-direction: column;">
                <div class="card-header" style="padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
                  <span class="badge badge-secondary" style="font-weight: 700;">Screenshot #${idx + 1}</span>
                  <span style="font-size: 0.72rem; color: #94a3b8;">9:16 Ratio</span>
                </div>
                
                <!-- Mockup Preview Canvas Frame -->
                <div style="padding: 16px; background: rgba(0, 0, 0, 0.4); display: flex; justify-content: center; align-items: center;">
                  <div class="phone-mockup-frame" id="phone-frame-${ss.id}" style="width: 220px; height: 390px; border-radius: 28px; overflow: hidden; position: relative; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8); border: 2px solid rgba(255, 255, 255, 0.15); ${
                hasCustomImg ? '' : `background: ${ss.gradient};`
              }">
                    ${
                      hasCustomImg
                        ? `
                      <img src="${ss.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${escapeHtml(ss.title)}" />
                    `
                        : `
                      <!-- Generated High-Fidelity UI Card Mockup -->
                      <div style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 14px; box-sizing: border-box; justify-content: space-between;">
                        <!-- Marketing Top Header -->
                        <div style="text-align: center; margin-top: 4px;">
                          <span style="background: rgba(255,255,255,0.15); color: #fff; font-size: 0.62rem; font-weight: 700; padding: 2px 8px; border-radius: 12px; letter-spacing: 0.05em; text-transform: uppercase;">
                            ${ss.badge || 'PROMPT'}
                          </span>
                          <div style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 0.82rem; color: #fff; margin-top: 6px; line-height: 1.2;">
                            ${ss.headline || ss.title}
                          </div>
                        </div>

                        <!-- Inner Screen App Content -->
                        <div style="background: rgba(15, 23, 42, 0.85); border-radius: 14px; padding: 10px; border: 1px solid rgba(255,255,255,0.1); margin: 8px 0; display: flex; flex-direction: column; gap: 6px;">
                          <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.6rem; color: #38bdf8; font-weight: 700;">PROMPT VAULT</span>
                            <span style="font-size: 0.58rem; background: #6366f1; color: white; padding: 1px 6px; border-radius: 8px;">1-Click Copy</span>
                          </div>
                          <div style="font-size: 0.65rem; color: #f1f5f9; line-height: 1.35; max-height: 110px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical;">
                            "${escapeHtml(ss.promptText || '')}"
                          </div>
                          <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px;">
                            ${(ss.tags || [])
                              .map(
                                (t) =>
                                  `<span style="font-size: 0.55rem; background: rgba(255,255,255,0.08); color: #cbd5e1; padding: 1px 5px; border-radius: 4px;">${t}</span>`
                              )
                              .join('')}
                          </div>
                        </div>

                        <!-- Bottom Action Indicator -->
                        <div style="display: flex; justify-content: center;">
                          <div style="background: linear-gradient(135deg, #6366f1, #06b6d4); border-radius: 20px; padding: 4px 16px; font-size: 0.65rem; font-weight: 700; color: white; display: flex; align-items: center; gap: 4px;">
                            <span>Ready to Test</span>
                          </div>
                        </div>
                      </div>
                    `
                    }
                  </div>
                </div>

                <!-- Info & Actions -->
                <div class="card-body" style="padding: 14px; display: flex; flex-direction: column; gap: 10px; flex: 1; justify-content: space-between;">
                  <div>
                    <div style="font-weight: 700; color: #fff; font-size: 0.88rem;">${escapeHtml(ss.title)}</div>
                    <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 2px;">${escapeHtml(ss.subtitle)}</div>
                  </div>

                  <div style="display: flex; gap: 8px;">
                    <button class="btn btn-primary btn-sm btn-download-single-phone-ss" data-id="${ss.id}" data-idx="${idx}" style="flex: 1; font-size: 0.78rem;">
                      <i data-lucide="download" style="width: 13px; height: 13px;"></i> Download PNG
                    </button>
                  </div>
                </div>
              </div>
            `;
            })
            .join('')}
        </div>

      </div>
    `;
  }

  function setupPhoneScreenshotsTabEvents() {
    // Individual phone screenshot download using HTML Canvas
    container.querySelectorAll('.btn-download-single-phone-ss').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const ss = listingData.screenshotsPhone[idx];
        if (ss) {
          generateAndDownloadPhoneScreenshot(ss, idx + 1);
        }
      });
    });

    // Download all phone screenshots
    container.querySelector('#btn-download-all-phone-ss')?.addEventListener('click', () => {
      listingData.screenshotsPhone.forEach((ss, idx) => {
        setTimeout(() => {
          generateAndDownloadPhoneScreenshot(ss, idx + 1);
        }, idx * 400);
      });
      toast.success('Triggered downloads for all 5 phone screenshots!');
    });
  }

  // =========================================================================
  // TAB 4: TABLET SCREENSHOTS (7" & 10")
  // =========================================================================
  function renderTabletScreenshotsTab() {
    return `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Guidelines Card -->
        <div class="card" style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08);">
          <div class="card-body" style="padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #fff; font-size: 0.95rem;">
                <i data-lucide="tablet" style="color: #06b6d4;"></i>
                7-Inch & 10-Inch Tablet Screenshots Specification
              </div>
              <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">
                Google Play requires tablet screenshots (16:10 or 4:3, e.g. 1920 × 1200 px or 2560 × 1600 px) to qualify for "Designed for Tablets" feature placement in the Play Store.
              </div>
            </div>
          </div>
        </div>

        <!-- Tablet Mockups -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          ${listingData.screenshotsTablet
            .map(
              (ss, idx) => `
            <div class="card">
              <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div>
                  <div class="card-title" style="font-size: 1rem;">${escapeHtml(ss.title)}</div>
                  <div style="font-size: 0.78rem; color: #94a3b8;">${escapeHtml(ss.subtitle)} &bull; 16:10 Landscape Ratio</div>
                </div>
                <button class="btn btn-primary btn-sm btn-download-tablet-ss" data-idx="${idx}">
                  <i data-lucide="download" style="width: 14px; height: 14px;"></i> Download 1920×1200 Tablet PNG
                </button>
              </div>
              <div class="card-body" style="display: flex; justify-content: center; background: rgba(0, 0, 0, 0.4); padding: 24px;">
                <!-- Tablet Device Frame -->
                <div style="width: 100%; max-width: 820px; aspect-ratio: 16 / 10; border-radius: 20px; overflow: hidden; background: ${
                  ss.gradient
                }; border: 3px solid rgba(255,255,255,0.18); box-shadow: 0 15px 40px rgba(0,0,0,0.8); display: flex; flex-direction: column; padding: 24px; box-sizing: border-box; justify-content: space-between;">
                  
                  <!-- Top Tablet Marketing Header -->
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span style="background: linear-gradient(135deg, #6366f1, #06b6d4); color: white; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">
                        ${ss.badge}
                      </span>
                      <span style="font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 800; color: #fff;">
                        ${ss.headline}
                      </span>
                    </div>
                    <div style="font-size: 0.78rem; color: #94a3b8;">PromptAI for Tablets</div>
                  </div>

                  <!-- Tablet Multi-Column App Layout Representation -->
                  <div style="display: grid; grid-template-columns: 220px 1fr 1fr; gap: 14px; height: 68%; margin: 12px 0;">
                    
                    <!-- Tablet Sidebar Navigation -->
                    <div style="background: rgba(15, 23, 42, 0.8); border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                      <div style="font-size: 0.72rem; color: #38bdf8; font-weight: 700; text-transform: uppercase;">Categories</div>
                      <div style="font-size: 0.72rem; color: #fff; background: rgba(99, 102, 241, 0.3); padding: 5px 8px; border-radius: 6px;">✨ Trending Prompts</div>
                      <div style="font-size: 0.72rem; color: #94a3b8; padding: 5px 8px;">🎬 AI Video Motion</div>
                      <div style="font-size: 0.72rem; color: #94a3b8; padding: 5px 8px;">🎨 Photorealistic 8K</div>
                      <div style="font-size: 0.72rem; color: #94a3b8; padding: 5px 8px;">🦾 Cyberpunk Sci-Fi</div>
                      <div style="font-size: 0.72rem; color: #94a3b8; padding: 5px 8px;">📐 Architecture & 3D</div>
                    </div>

                    <!-- Tablet Center Feed Card 1 -->
                    <div style="background: rgba(15, 23, 42, 0.8); border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">
                      <div>
                        <div style="height: 100px; background: linear-gradient(135deg, #a855f7, #6366f1); border-radius: 8px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #fff; font-weight: 600;">
                          Midjourney v6 Art Card
                        </div>
                        <div style="font-size: 0.75rem; color: #f8fafc; font-weight: 600;">Neon Samurai in Rain</div>
                        <div style="font-size: 0.68rem; color: #94a3b8; line-height: 1.3; margin-top: 4px;">Hyperrealistic cinematic lighting, 8k resolution, Unreal Engine 5 render...</div>
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.65rem; color: #06b6d4;">--ar 16:9</span>
                        <span style="font-size: 0.65rem; background: #6366f1; color: white; padding: 2px 8px; border-radius: 6px;">Copy</span>
                      </div>
                    </div>

                    <!-- Tablet Center Feed Card 2 -->
                    <div style="background: rgba(15, 23, 42, 0.8); border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">
                      <div>
                        <div style="height: 100px; background: linear-gradient(135deg, #06b6d4, #10b981); border-radius: 8px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #fff; font-weight: 600;">
                          OpenAI Sora Video Card
                        </div>
                        <div style="font-size: 0.75rem; color: #f8fafc; font-weight: 600;">Cosmic Bioluminescent Forest</div>
                        <div style="font-size: 0.68rem; color: #94a3b8; line-height: 1.3; margin-top: 4px;">Camera slowly orbits glowing mushroom grove, spores drifting in wind...</div>
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.65rem; color: #10b981;">Motion: Orbit</span>
                        <span style="font-size: 0.65rem; background: #6366f1; color: white; padding: 2px 8px; border-radius: 6px;">Copy</span>
                      </div>
                    </div>

                  </div>

                  <!-- Tablet Bottom Status -->
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: #94a3b8;">
                    <span>PromptAI Tablet Edition &bull; High Resolution Inspiration Grid</span>
                    <span>10,000+ Curated Prompts Ready</span>
                  </div>

                </div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>

      </div>
    `;
  }

  function setupTabletScreenshotsTabEvents() {
    container.querySelectorAll('.btn-download-tablet-ss').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const ss = listingData.screenshotsTablet[idx];
        if (ss) {
          generateAndDownloadTabletScreenshot(ss, idx + 1);
        }
      });
    });
  }

  // =========================================================================
  // TAB 5: LIVE GOOGLE PLAY STORE SIMULATOR
  // =========================================================================
  function renderSimulatorTab() {
    return `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div>
            <h2 style="font-size: 1.2rem; font-weight: 700; color: #fff; margin: 0;">Live Google Play Store Simulator</h2>
            <p style="font-size: 0.8rem; color: #94a3b8; margin: 2px 0 0 0;">
              Preview how your app appears to millions of users directly on the Google Play Store client
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge badge-success">LIVE PREVIEW</span>
          </div>
        </div>

        <!-- Google Play Mock Container -->
        <div class="google-play-mock-wrapper" style="max-width: 860px; margin: 0 auto; width: 100%; background: #131314; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.12); overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8); font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;">
          
          <!-- Play Store Top Bar -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); background: #1b1b1f;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <svg viewBox="0 0 40 40" width="24" height="24">
                <path d="M7 6l22 14L7 34z" fill="#00e676" />
                <path d="M29 20L7 6l13 14z" fill="#00b0ff" />
                <path d="M20 20l9 0L7 34z" fill="#ff1744" />
                <path d="M29 20l5-3-5-3z" fill="#ffd600" />
              </svg>
              <span style="font-size: 0.95rem; font-weight: 600; color: #e3e3e3;">Google Play</span>
            </div>
            <div style="display: flex; gap: 16px; align-items: center; color: #c4c7c5; font-size: 0.85rem;">
              <span>Games</span>
              <span style="color: #a8c7fa; font-weight: 600; border-bottom: 2px solid #a8c7fa; padding-bottom: 2px;">Apps</span>
              <span>Search</span>
            </div>
          </div>

          <!-- Feature Graphic Banner -->
          <div style="width: 100%; aspect-ratio: 1024 / 420; max-height: 320px; overflow: hidden; position: relative;">
            <img src="${listingData.featureGraphicUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/admin/assets/playstore/feature-graphic.jpg'" />
            <div style="position: absolute; inset: 0; background: linear-gradient(to top, #131314 0%, transparent 60%);"></div>
          </div>

          <!-- Main App Header Details -->
          <div style="padding: 0 28px 24px 28px; display: flex; gap: 24px; align-items: flex-start; margin-top: -40px; position: relative;">
            
            <!-- App Icon with Google Play Squircle -->
            <div style="width: 100px; height: 100px; border-radius: 22px; overflow: hidden; box-shadow: 0 8px 25px rgba(0,0,0,0.6); flex-shrink: 0; border: 1px solid rgba(255,255,255,0.15); background: #000;">
              <img src="${listingData.appIconUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/admin/assets/playstore/app_icon_3.png'" />
            </div>

            <!-- Title & Metadata -->
            <div style="flex: 1;">
              <h1 style="font-size: 1.5rem; font-weight: 500; color: #e3e3e3; margin: 0; line-height: 1.2;">
                ${escapeHtml(listingData.appName)}
              </h1>
              <div style="font-size: 0.88rem; color: #00875a; font-weight: 500; margin-top: 4px;">
                Creative AI Studio &bull; In-app ads
              </div>

              <!-- Rating / Downloads Row -->
              <div style="display: flex; gap: 20px; align-items: center; margin-top: 14px; flex-wrap: wrap;">
                <div>
                  <div style="font-size: 0.95rem; font-weight: 700; color: #e3e3e3; display: flex; align-items: center; gap: 4px;">
                    4.8 ★
                  </div>
                  <div style="font-size: 0.72rem; color: #8e918f;">14K reviews</div>
                </div>
                <div style="width: 1px; height: 24px; background: rgba(255,255,255,0.1);"></div>
                <div>
                  <div style="font-size: 0.95rem; font-weight: 700; color: #e3e3e3;">100K+</div>
                  <div style="font-size: 0.72rem; color: #8e918f;">Downloads</div>
                </div>
                <div style="width: 1px; height: 24px; background: rgba(255,255,255,0.1);"></div>
                <div>
                  <div style="font-size: 0.85rem; font-weight: 700; color: #e3e3e3; border: 1px solid #8e918f; padding: 0 4px; border-radius: 3px; display: inline-block;">
                    3+
                  </div>
                  <div style="font-size: 0.72rem; color: #8e918f;">Rated for 3+</div>
                </div>
              </div>

              <!-- Green Install Button -->
              <div style="margin-top: 18px; display: flex; gap: 12px; align-items: center;">
                <button style="background: #00875a; color: #fff; font-weight: 600; font-size: 0.9rem; padding: 10px 36px; border-radius: 8px; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(0, 135, 90, 0.4);">
                  Install
                </button>
                <button style="background: transparent; color: #a8c7fa; font-size: 0.85rem; font-weight: 500; border: 1px solid rgba(168, 199, 250, 0.3); padding: 9px 18px; border-radius: 8px; cursor: pointer;">
                  Add to wishlist
                </button>
              </div>

            </div>
          </div>

          <!-- Screenshots Carousel -->
          <div style="padding: 16px 28px; border-top: 1px solid rgba(255,255,255,0.06);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 0.95rem; font-weight: 500; color: #e3e3e3;">App preview</span>
              <span style="font-size: 0.78rem; color: #a8c7fa;">Phone &bull; Tablet</span>
            </div>

            <!-- Scrollable phone screenshots -->
            <div style="display: flex; gap: 14px; overflow-x: auto; padding-bottom: 10px;">
              <div style="width: 140px; height: 260px; border-radius: 14px; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 15px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);">
                <img src="${listingData.screenshotsPhone[0]?.imageUrl || '/admin/assets/playstore/screenshot-phone-1.jpg'}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/admin/assets/playstore/screenshot-phone-1.jpg'" />
              </div>
              <div style="width: 140px; height: 260px; border-radius: 14px; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 15px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); background: linear-gradient(135deg, #1e1b4b, #311042); padding: 10px; display: flex; flex-direction: column; justify-content: space-between;">
                <div style="font-size: 0.65rem; color: #fff; font-weight: 700; text-align: center;">1-CLICK COPY & PROMPTS</div>
                <div style="background: rgba(0,0,0,0.4); padding: 6px; border-radius: 6px; font-size: 0.55rem; color: #cbd5e1;">Photorealistic Cyberpunk City Street in Rain...</div>
                <div style="background: #6366f1; color: white; text-align: center; border-radius: 4px; font-size: 0.55rem; padding: 2px;">Copy Prompt</div>
              </div>
              <div style="width: 140px; height: 260px; border-radius: 14px; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 15px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); background: linear-gradient(135deg, #0f2027, #2c5364); padding: 10px; display: flex; flex-direction: column; justify-content: space-between;">
                <div style="font-size: 0.65rem; color: #fff; font-weight: 700; text-align: center;">AI VIDEO REELS</div>
                <div style="background: rgba(0,0,0,0.4); padding: 6px; border-radius: 6px; font-size: 0.55rem; color: #cbd5e1;">OpenAI Sora & Runway Gen-3 Motion Prompts</div>
                <div style="background: #10b981; color: white; text-align: center; border-radius: 4px; font-size: 0.55rem; padding: 2px;">Camera: Orbit</div>
              </div>
              <div style="width: 140px; height: 260px; border-radius: 14px; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 15px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); background: linear-gradient(135deg, #1f1c2c, #928dab); padding: 10px; display: flex; flex-direction: column; justify-content: space-between;">
                <div style="font-size: 0.65rem; color: #fff; font-weight: 700; text-align: center;">30+ CATEGORIES</div>
                <div style="background: rgba(0,0,0,0.4); padding: 6px; border-radius: 6px; font-size: 0.55rem; color: #cbd5e1;">Anime, 3D Isometric, Architecture, Fashion</div>
                <div style="background: #a855f7; color: white; text-align: center; border-radius: 4px; font-size: 0.55rem; padding: 2px;">Explore</div>
              </div>
            </div>
          </div>

          <!-- About this app -->
          <div style="padding: 20px 28px; border-top: 1px solid rgba(255,255,255,0.06);">
            <div style="font-size: 1rem; font-weight: 500; color: #e3e3e3; margin-bottom: 8px;">
              About this app
            </div>
            <div style="font-size: 0.88rem; color: #c4c7c5; line-height: 1.5; margin-bottom: 14px;">
              ${escapeHtml(listingData.shortDescription)}
            </div>

            <!-- Tags Row -->
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
              <span style="font-size: 0.75rem; background: #2b2b2f; color: #c4c7c5; padding: 4px 10px; border-radius: 12px;">#1 Art & Design</span>
              <span style="font-size: 0.75rem; background: #2b2b2f; color: #c4c7c5; padding: 4px 10px; border-radius: 12px;">AI Prompts</span>
              <span style="font-size: 0.75rem; background: #2b2b2f; color: #c4c7c5; padding: 4px 10px; border-radius: 12px;">Midjourney</span>
              <span style="font-size: 0.75rem; background: #2b2b2f; color: #c4c7c5; padding: 4px 10px; border-radius: 12px;">Sora Video</span>
            </div>

            <!-- Collapsible Long Description Preview -->
            <div id="sim-long-desc-container" style="max-height: 120px; overflow: hidden; position: relative; font-size: 0.82rem; color: #8e918f; line-height: 1.5; white-space: pre-line;">
              ${escapeHtml(listingData.longDescription)}
              <div id="sim-fade-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; height: 60px; background: linear-gradient(to top, #131314 0%, transparent 100%);"></div>
            </div>

            <button id="sim-expand-desc-btn" style="background: transparent; border: none; color: #a8c7fa; font-size: 0.85rem; font-weight: 600; cursor: pointer; padding: 8px 0; display: flex; align-items: center; gap: 4px;">
              <span>Read more</span>
              <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
            </button>
          </div>

          <!-- Data Safety / App Info Footer -->
          <div style="padding: 16px 28px 24px 28px; border-top: 1px solid rgba(255,255,255,0.06); background: #18181b; display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: #8e918f;">
            <div>Updated: September 2026 &bull; Version 1.0.0</div>
            <div>Google Play Protect Certified</div>
          </div>

        </div>

      </div>
    `;
  }

  function setupSimulatorTabEvents() {
    const expandBtn = container.querySelector('#sim-expand-desc-btn');
    const descBox = container.querySelector('#sim-long-desc-container');
    const fadeOverlay = container.querySelector('#sim-fade-overlay');

    let expanded = false;
    expandBtn?.addEventListener('click', () => {
      expanded = !expanded;
      if (expanded) {
        descBox.style.maxHeight = 'none';
        fadeOverlay.style.display = 'none';
        expandBtn.innerHTML = `<span>Show less</span> <i data-lucide="chevron-up" style="width: 14px; height: 14px;"></i>`;
      } else {
        descBox.style.maxHeight = '120px';
        fadeOverlay.style.display = 'block';
        expandBtn.innerHTML = `<span>Read more</span> <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>`;
      }
      if (window.lucide) window.lucide.createIcons();
    });
  }

  // =========================================================================
  // GLOBAL ACTIONS & UTILITIES
  // =========================================================================
  function setupGlobalEvents() {
    // Tab switching
    container.querySelectorAll('.store-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.store-tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.getAttribute('data-tab');
        renderActiveTabContent();
      });
    });

    // Save changes to backend
    container.querySelector('#btn-save-to-backend')?.addEventListener('click', async () => {
      const btn = container.querySelector('#btn-save-to-backend');
      if (!btn) return;
      btn.disabled = true;
      const origHtml = btn.innerHTML;
      btn.innerHTML = `<i data-lucide="loader" style="width: 14px; height: 14px; animation: spin 1s linear infinite;"></i> Saving...`;
      if (window.lucide) window.lucide.createIcons();

      try {
        await api.updateAppSetting('playstore_listing_data', JSON.stringify(listingData));
        toast.success('Saved Play Store listing details to database!');
      } catch (err) {
        toast.error(err.message || 'Failed to persist listing details');
      } finally {
        btn.disabled = false;
        btn.innerHTML = origHtml;
        if (window.lucide) window.lucide.createIcons();
      }
    });

    // Copy all metadata formatted for Google Play Console
    container.querySelector('#btn-copy-all-metadata')?.addEventListener('click', () => {
      const allText = `=====================================================
GOOGLE PLAY STORE LISTING DETAILS
=====================================================

[APP NAME (TITLE)] (Max 30 chars)
${listingData.appName}

[SHORT DESCRIPTION] (Max 80 chars)
${listingData.shortDescription}

[CATEGORY]
Primary: ${listingData.category}
Secondary: ${listingData.secondaryCategory}

[CONTENT RATING]
${listingData.contentRating}

[CONTACT & PRIVACY]
Developer Email: ${listingData.developerEmail}
Privacy Policy: ${listingData.privacyPolicyUrl}

[FULL / LONG DESCRIPTION] (Max 4,000 chars)
-----------------------------------------------------
${listingData.longDescription}
-----------------------------------------------------

[ASSETS MANIFEST]
App Icon: ${listingData.appIconUrl}
Feature Graphic: ${listingData.featureGraphicUrl}
Phone Screenshots: ${listingData.screenshotsPhone.length} mockups
Tablet Screenshots: ${listingData.screenshotsTablet.length} mockups
`;
      navigator.clipboard.writeText(allText);
      toast.success('Copied all Google Play Console text fields to clipboard!');
    });

    // Export metadata JSON
    container.querySelector('#btn-export-json')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(listingData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `playstore_listing_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded playstore_listing.json');
    });
  }

  // =========================================================================
  // CLIENT-SIDE CANVAS GENERATOR (Exports 1080x1920 Phone & 1920x1200 Tablet PNGs)
  // =========================================================================
  function generateAndDownloadPhoneScreenshot(ss, index) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
    if (index === 1) {
      bgGrad.addColorStop(0, '#100e2a');
      bgGrad.addColorStop(0.5, '#1e1b4b');
      bgGrad.addColorStop(1, '#0b0f19');
    } else if (index === 2) {
      bgGrad.addColorStop(0, '#1e102f');
      bgGrad.addColorStop(0.5, '#311042');
      bgGrad.addColorStop(1, '#090b14');
    } else if (index === 3) {
      bgGrad.addColorStop(0, '#0f2027');
      bgGrad.addColorStop(0.5, '#203a43');
      bgGrad.addColorStop(1, '#071018');
    } else {
      bgGrad.addColorStop(0, '#161329');
      bgGrad.addColorStop(0.5, '#231d45');
      bgGrad.addColorStop(1, '#0b0d18');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Glowing background orbs
    const orbGrad = ctx.createRadialGradient(540, 300, 50, 540, 300, 600);
    orbGrad.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
    orbGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(540, 300, 600, 0, Math.PI * 2);
    ctx.fill();

    // Top Marketing Headline Text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#818cf8';
    ctx.font = 'bold 36px "Inter", sans-serif';
    ctx.fillText((ss.badge || 'PROMPT').toUpperCase(), 540, 150);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px "Outfit", "Inter", sans-serif';
    ctx.fillText(ss.headline || ss.title, 540, 230);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 36px "Inter", sans-serif';
    ctx.fillText(ss.subtitle || '', 540, 290);

    // Render smartphone frame in center
    const phoneX = 140;
    const phoneY = 360;
    const phoneW = 800;
    const phoneH = 1500;
    const radius = 64;

    // Phone shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 30;

    // Outer Phone border
    ctx.fillStyle = '#1e293b';
    roundRect(ctx, phoneX, phoneY, phoneW, phoneH, radius);
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // Phone screen
    const screenMargin = 16;
    const screenX = phoneX + screenMargin;
    const screenY = phoneY + screenMargin;
    const screenW = phoneW - screenMargin * 2;
    const screenH = phoneH - screenMargin * 2;

    const screenGrad = ctx.createLinearGradient(screenX, screenY, screenX, screenY + screenH);
    screenGrad.addColorStop(0, '#0a0f1d');
    screenGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = screenGrad;
    roundRect(ctx, screenX, screenY, screenW, screenH, radius - 10);
    ctx.fill();

    // App header inside phone
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "Outfit", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('PromptAI', screenX + 48, screenY + 90);

    // Search bar representation
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    roundRect(ctx, screenX + 48, screenY + 130, screenW - 96, 68, 18);
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.font = '32px "Inter", sans-serif';
    ctx.fillText('🔍 Search 10,000+ curated prompts...', screenX + 78, screenY + 175);

    // Card representation 1
    const cardY = screenY + 240;
    const cardH = 520;
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    roundRect(ctx, screenX + 48, cardY, screenW - 96, cardH, 24);
    ctx.fill();

    // Image placeholder
    const imgGrad = ctx.createLinearGradient(screenX + 48, cardY, screenX + screenW - 48, cardY + 280);
    imgGrad.addColorStop(0, '#6366f1');
    imgGrad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = imgGrad;
    roundRect(ctx, screenX + 64, cardY + 16, screenW - 128, 280, 16);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Outfit", sans-serif';
    ctx.fillText('Curated AI Inspiration', screenX + 90, cardY + 160);

    // Prompt text inside card
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '32px "Inter", sans-serif';
    ctx.fillText(`"${(ss.promptText || 'Photorealistic 8K cinematic portrait...').slice(0, 45)}..."`, screenX + 64, cardY + 340);

    // Copy button inside card
    ctx.fillStyle = '#6366f1';
    roundRect(ctx, screenX + 64, cardY + 410, 260, 64, 16);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Inter", sans-serif';
    ctx.fillText('⚡ Copy Prompt', screenX + 96, cardY + 452);

    // Card representation 2
    const card2Y = cardY + cardH + 30;
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    roundRect(ctx, screenX + 48, card2Y, screenW - 96, 460, 24);
    ctx.fill();

    const img2Grad = ctx.createLinearGradient(screenX + 48, card2Y, screenX + screenW - 48, card2Y + 260);
    img2Grad.addColorStop(0, '#ec4899');
    img2Grad.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = img2Grad;
    roundRect(ctx, screenX + 64, card2Y + 16, screenW - 128, 260, 16);
    ctx.fill();

    // Trigger Download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `playstore_screenshot_phone_${index}_1080x1920.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded phone screenshot #${index} (1080×1920 PNG)!`);
    }, 'image/png');
  }

  function generateAndDownloadTabletScreenshot(ss, index) {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1920, 1200);
    bgGrad.addColorStop(0, '#0a0f1d');
    bgGrad.addColorStop(0.5, '#1e1b4b');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1920, 1200);

    // Top Header
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 32px "Inter", sans-serif';
    ctx.fillText((ss.badge || 'TABLET').toUpperCase(), 960, 90);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px "Outfit", sans-serif';
    ctx.fillText(ss.headline || ss.title, 960, 160);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 30px "Inter", sans-serif';
    ctx.fillText(ss.subtitle || '', 960, 210);

    // Tablet Frame
    const tabX = 160;
    const tabY = 260;
    const tabW = 1600;
    const tabH = 880;
    const radius = 40;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 25;

    ctx.fillStyle = '#1e293b';
    roundRect(ctx, tabX, tabY, tabW, tabH, radius);
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // Screen
    const screenX = tabX + 16;
    const screenY = tabY + 16;
    const screenW = tabW - 32;
    const screenH = tabH - 32;

    ctx.fillStyle = '#0f172a';
    roundRect(ctx, screenX, screenY, screenW, screenH, radius - 8);
    ctx.fill();

    // 3-Column Tablet Grid Inside
    const colW = (screenW - 96) / 3;

    // Col 1: Sidebar
    ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
    roundRect(ctx, screenX + 32, screenY + 32, colW, screenH - 64, 20);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Outfit", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('PromptAI Tablet', screenX + 64, screenY + 90);

    // Col 2: Art card
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    roundRect(ctx, screenX + 48 + colW, screenY + 32, colW, screenH - 64, 20);
    ctx.fill();

    const c2Grad = ctx.createLinearGradient(screenX + 48 + colW, screenY + 48, screenX + 48 + colW * 2, screenY + 380);
    c2Grad.addColorStop(0, '#6366f1');
    c2Grad.addColorStop(1, '#a855f7');
    ctx.fillStyle = c2Grad;
    roundRect(ctx, screenX + 64 + colW, screenY + 48, colW - 32, 380, 16);
    ctx.fill();

    // Col 3: Video card
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    roundRect(ctx, screenX + 64 + colW * 2, screenY + 32, colW, screenH - 64, 20);
    ctx.fill();

    const c3Grad = ctx.createLinearGradient(screenX + 64 + colW * 2, screenY + 48, screenX + 64 + colW * 3, screenY + 380);
    c3Grad.addColorStop(0, '#06b6d4');
    c3Grad.addColorStop(1, '#10b981');
    ctx.fillStyle = c3Grad;
    roundRect(ctx, screenX + 80 + colW * 2, screenY + 48, colW - 32, 380, 16);
    ctx.fill();

    // Trigger download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `playstore_screenshot_tablet_${index}_1920x1200.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded tablet screenshot #${index} (1920×1200 PNG)!`);
    }, 'image/png');
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  renderView();
}
