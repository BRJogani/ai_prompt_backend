import { PrismaClient, ContentType, PromptStatus, AdType, TargetPlatform, AdFrequencyType } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

/**
 * Phase 2 seed data.
 *
 * Populates realistic content for development and testing: an admin account,
 * categories, AI tools, tags, sample prompts with free/premium flags,
 * default remote app settings / feature flags, ad configs, and app version rows.
 */

// ---------------------------------------------------------------------------
// Admin user
// ---------------------------------------------------------------------------
async function seedAdmin() {
  const email = process.env.ADMIN_DEFAULT_EMAIL ?? 'admin@example.com';
  const password = process.env.ADMIN_DEFAULT_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await argon2.hash(password);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });

  console.log(`✅ Admin user ready: ${admin.email} (password from ADMIN_DEFAULT_PASSWORD env var)`);
  return admin;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
const CATEGORY_SEED = [
  { name: 'Fashion', slug: 'fashion', isFeatured: true, videoEnabled: true },
  { name: 'Anime', slug: 'anime', isFeatured: true, videoEnabled: false },
  { name: 'Cinematic', slug: 'cinematic', isFeatured: true, videoEnabled: true },
  { name: 'Portrait', slug: 'portrait', isFeatured: false, videoEnabled: true },
  { name: 'Product', slug: 'product', isFeatured: false, videoEnabled: true },
  { name: '3D Art', slug: '3d-art', isFeatured: false, videoEnabled: true },
];

async function seedCategories() {
  const categories = [];
  for (const [index, cat] of CATEGORY_SEED.entries()) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: `Curated ${cat.name.toLowerCase()} prompt inspiration.`,
        status: 'ACTIVE',
        sortOrder: index,
        isFeatured: cat.isFeatured,
        videoEnabled: cat.videoEnabled,
      },
    });
    categories.push(category);
  }
  console.log(`✅ Seeded ${categories.length} categories`);
  return categories;
}

// ---------------------------------------------------------------------------
// AI Tools
// ---------------------------------------------------------------------------
const AI_TOOL_SEED = [
  { name: 'ChatGPT', slug: 'chatgpt', websiteUrl: 'https://chat.openai.com', contentTypes: [ContentType.IMAGE] },
  { name: 'Gemini', slug: 'gemini', websiteUrl: 'https://gemini.google.com', contentTypes: [ContentType.IMAGE] },
  {
    name: 'Midjourney',
    slug: 'midjourney',
    websiteUrl: 'https://www.midjourney.com',
    contentTypes: [ContentType.IMAGE],
  },
  { name: 'Veo', slug: 'veo', websiteUrl: 'https://deepmind.google/technologies/veo', contentTypes: [ContentType.VIDEO] },
  { name: 'Other', slug: 'other', websiteUrl: null, contentTypes: [ContentType.BOTH] },
] as const;

async function seedAiTools() {
  const tools = [];
  for (const [index, tool] of AI_TOOL_SEED.entries()) {
    const created = await prisma.aiTool.upsert({
      where: { slug: tool.slug },
      update: {},
      create: {
        name: tool.name,
        slug: tool.slug,
        description: `Generate content using ${tool.name}.`,
        websiteUrl: tool.websiteUrl ?? undefined,
        contentTypes: [...tool.contentTypes],
        status: 'ACTIVE',
        sortOrder: index,
      },
    });
    tools.push(created);
  }
  console.log(`✅ Seeded ${tools.length} AI tools`);
  return tools;
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------
const TAG_SEED = ['cinematic', 'fashion', 'portrait', 'luxury', 'anime', 'product', '3d', 'viral'];

async function seedTags() {
  const tags = [];
  for (const name of TAG_SEED) {
    const tag = await prisma.tag.upsert({
      where: { slug: name },
      update: {},
      create: { name: name[0].toUpperCase() + name.slice(1), slug: name },
    });
    tags.push(tag);
  }
  console.log(`✅ Seeded ${tags.length} tags`);
  return tags;
}

// ---------------------------------------------------------------------------
// Sample prompts + media (with isPremium flag)
// ---------------------------------------------------------------------------
async function seedPrompts(
  categories: Awaited<ReturnType<typeof seedCategories>>,
  aiTools: Awaited<ReturnType<typeof seedAiTools>>,
  tags: Awaited<ReturnType<typeof seedTags>>,
) {
  const byCategorySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
  const byToolSlug = Object.fromEntries(aiTools.map((t) => [t.slug, t]));
  const byTagSlug = Object.fromEntries(tags.map((t) => [t.slug, t]));

  const samplePrompts = [
    {
      title: 'Cinematic Luxury Portrait',
      slug: 'cinematic-luxury-portrait',
      promptText:
        'A cinematic portrait of a woman in a luxury red dress, golden hour lighting, shallow depth of field, shot on 85mm lens, ultra realistic',
      category: 'portrait',
      tool: 'midjourney',
      contentType: ContentType.IMAGE,
      tagSlugs: ['cinematic', 'portrait', 'luxury'],
      isFeatured: true,
      isTrending: true,
      isPremium: true,
      media: { type: 'IMAGE' as const, publicId: 'ai-prompt-app/prompts/sample-1', format: 'jpg', duration: null },
    },
    {
      title: 'Anime Warrior in the Rain',
      slug: 'anime-warrior-in-the-rain',
      promptText:
        'Anime-style warrior standing in heavy rain, dramatic lighting, detailed armor, studio ghibli inspired background',
      category: 'anime',
      tool: 'midjourney',
      contentType: ContentType.IMAGE,
      tagSlugs: ['anime', 'cinematic'],
      isFeatured: true,
      isTrending: false,
      isPremium: false,
      media: { type: 'IMAGE' as const, publicId: 'ai-prompt-app/prompts/sample-2', format: 'jpg', duration: null },
    },
    {
      title: 'Product Shot: Minimal Perfume Bottle',
      slug: 'product-shot-minimal-perfume-bottle',
      promptText:
        'Studio product photography of a minimalist glass perfume bottle on a marble pedestal, soft studio lighting, white background',
      category: 'product',
      tool: 'chatgpt',
      contentType: ContentType.IMAGE,
      tagSlugs: ['product', 'luxury'],
      isFeatured: false,
      isTrending: true,
      isPremium: false,
      media: { type: 'IMAGE' as const, publicId: 'ai-prompt-app/prompts/sample-3', format: 'jpg', duration: null },
    },
    {
      title: 'Fashion Runway Walk — Slow Motion',
      slug: 'fashion-runway-walk-slow-motion',
      promptText:
        'A model walking a fashion runway in slow motion, avant-garde couture outfit, dramatic spotlighting, cinematic camera movement',
      category: 'fashion',
      tool: 'veo',
      contentType: ContentType.VIDEO,
      tagSlugs: ['fashion', 'cinematic', 'viral'],
      isFeatured: true,
      isTrending: true,
      isPremium: true,
      media: {
        type: 'VIDEO' as const,
        publicId: 'ai-prompt-app/prompts/sample-4',
        format: 'mp4',
        duration: 8.2,
      },
    },
    {
      title: 'Abstract 3D Liquid Metal Sculpture',
      slug: 'abstract-3d-liquid-metal-sculpture',
      promptText:
        'Abstract 3D render of liquid chrome metal forming a flowing sculpture, studio lighting, octane render, ultra high detail',
      category: '3d-art',
      tool: 'other',
      contentType: ContentType.IMAGE,
      tagSlugs: ['3d', 'viral'],
      isFeatured: false,
      isTrending: false,
      isPremium: false,
      media: { type: 'IMAGE' as const, publicId: 'ai-prompt-app/prompts/sample-5', format: 'jpg', duration: null },
    },
    {
      title: 'Neon City Flythrough',
      slug: 'neon-city-flythrough',
      promptText:
        'Cinematic drone flythrough of a neon-lit cyberpunk city at night, rain-soaked streets, volumetric fog, 4K',
      category: 'cinematic',
      tool: 'veo',
      contentType: ContentType.VIDEO,
      tagSlugs: ['cinematic', 'viral'],
      isFeatured: false,
      isTrending: true,
      isPremium: true,
      media: {
        type: 'VIDEO' as const,
        publicId: 'ai-prompt-app/prompts/sample-6',
        format: 'mp4',
        duration: 12.5,
      },
    },
  ];

  let created = 0;
  for (const [index, sample] of samplePrompts.entries()) {
    const category = byCategorySlug[sample.category];
    const tool = byToolSlug[sample.tool];

    const prompt = await prisma.prompt.upsert({
      where: { slug: sample.slug },
      update: {},
      create: {
        title: sample.title,
        slug: sample.slug,
        description: sample.promptText.slice(0, 120),
        promptText: sample.promptText,
        categoryId: category.id,
        aiToolId: tool.id,
        contentType: sample.contentType,
        status: PromptStatus.PUBLISHED,
        isFeatured: sample.isFeatured,
        isTrending: sample.isTrending,
        isPremium: sample.isPremium,
        sortOrder: index,
        publishedAt: new Date(),
        viewCount: Math.floor(Math.random() * 5000),
        favoriteCount: Math.floor(Math.random() * 500),
        copyCount: Math.floor(Math.random() * 800),
        shareCount: Math.floor(Math.random() * 200),
        media: {
          create: {
            mediaType: sample.media.type,
            cloudinaryPublicId: sample.media.publicId,
            secureUrl: `https://res.cloudinary.com/demo/${sample.media.type.toLowerCase()}/upload/${sample.media.publicId}.${sample.media.format}`,
            thumbnailUrl: `https://res.cloudinary.com/demo/${sample.media.type.toLowerCase()}/upload/c_thumb,w_400/${sample.media.publicId}.jpg`,
            width: 1024,
            height: 1024,
            duration: sample.media.duration,
            format: sample.media.format,
            sortOrder: 0,
          },
        },
        tags: {
          create: sample.tagSlugs.map((slug) => ({ tagId: byTagSlug[slug].id })),
        },
      },
    });

    const score = prompt.viewCount + prompt.favoriteCount * 3 + prompt.copyCount * 2 + prompt.shareCount * 5;
    await prisma.prompt.update({ where: { id: prompt.id }, data: { trendingScore: score } });

    created += 1;
  }
  console.log(`✅ Seeded ${created} sample prompts (with media, tags, & premium flags)`);
}

// ---------------------------------------------------------------------------
// Default remote app settings / feature flags
// ---------------------------------------------------------------------------
const APP_SETTING_SEED: Array<{ key: string; value: string; valueType: string; description: string }> = [
  { key: 'app_name', value: 'Viral AI Photo Prompt', valueType: 'string', description: 'Display name shown in the app.' },
  { key: 'daily_shuffle_enabled', value: 'true', valueType: 'boolean', description: 'Feature flag: Daily randomized synchronized prompt shuffling across all devices.' },
  { key: 'daily_shuffle_salt', value: '', valueType: 'string', description: 'Dynamic salt seed for daily synchronized prompt shuffling.' },
  { key: 'video_enabled', value: 'true', valueType: 'boolean', description: 'Global video visibility kill switch (Section 16).' },
  { key: 'search_enabled', value: 'true', valueType: 'boolean', description: 'Feature flag: search.' },
  { key: 'history_enabled', value: 'true', valueType: 'boolean', description: 'Feature flag: view history.' },
  { key: 'favorites_enabled', value: 'true', valueType: 'boolean', description: 'Feature flag: favorites.' },
  { key: 'sharing_enabled', value: 'true', valueType: 'boolean', description: 'Feature flag: sharing.' },
  { key: 'trending_enabled', value: 'true', valueType: 'boolean', description: 'Feature flag: trending section.' },
  { key: 'notifications_enabled', value: 'false', valueType: 'boolean', description: 'Feature flag: push notifications (not yet wired up).' },
  { key: 'ads_enabled', value: 'false', valueType: 'boolean', description: 'Master ads kill switch.' },
  { key: 'maintenance_mode', value: 'false', valueType: 'boolean', description: 'Global maintenance mode toggle (Section 28).' },
  { key: 'maintenance_message', value: 'We are currently updating the application. Please check back soon.', valueType: 'string', description: 'Message shown on the maintenance screen when maintenance_mode is true.' },
  { key: 'support_email', value: 'support@example.com', valueType: 'string', description: 'Support contact email.' },
  { key: 'privacy_policy_url', value: 'https://example.com/privacy', valueType: 'string', description: 'Privacy policy URL.' },
  { key: 'terms_url', value: 'https://example.com/terms', valueType: 'string', description: 'Terms of service URL.' },
  { key: 'about_text', value: 'Discover, copy, and get inspired by AI-generated prompts.', valueType: 'string', description: 'About screen copy.' },
];

async function seedAppSettings() {
  for (const setting of APP_SETTING_SEED) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`✅ Seeded ${APP_SETTING_SEED.length} app settings / feature flags`);
}

// ---------------------------------------------------------------------------
// Default ad configs
// ---------------------------------------------------------------------------
async function seedAdConfigs() {
  const configs: Array<{
    adType: AdType;
    platform: TargetPlatform;
    frequencyType: AdFrequencyType;
    frequencyValue: number;
    cooldownSeconds: number;
    maxPerSession: number;
  }> = [
    { adType: AdType.BANNER, platform: TargetPlatform.ALL, frequencyType: AdFrequencyType.MANUAL, frequencyValue: 0, cooldownSeconds: 0, maxPerSession: 0 },
    { adType: AdType.INTERSTITIAL, platform: TargetPlatform.ALL, frequencyType: AdFrequencyType.EVERY_N_ACTIONS, frequencyValue: 5, cooldownSeconds: 60, maxPerSession: 10 },
    { adType: AdType.REWARDED, platform: TargetPlatform.ALL, frequencyType: AdFrequencyType.MANUAL, frequencyValue: 0, cooldownSeconds: 0, maxPerSession: 0 },
    { adType: AdType.NATIVE, platform: TargetPlatform.ALL, frequencyType: AdFrequencyType.MANUAL, frequencyValue: 0, cooldownSeconds: 0, maxPerSession: 0 },
    { adType: AdType.APP_OPEN, platform: TargetPlatform.ALL, frequencyType: AdFrequencyType.ON_SCREEN_OPEN, frequencyValue: 0, cooldownSeconds: 30, maxPerSession: 3 },
  ];

  for (const config of configs) {
    await prisma.adConfig.upsert({
      where: { adType_platform: { adType: config.adType, platform: config.platform } },
      update: {},
      create: {
        adNetwork: 'ADMOB',
        adType: config.adType,
        platform: config.platform,
        adUnitId: '',
        enabled: false,
        frequencyType: config.frequencyType,
        frequencyValue: config.frequencyValue,
        cooldownSeconds: config.cooldownSeconds,
        maxPerSession: config.maxPerSession,
      },
    });
  }
  console.log(`✅ Seeded ${configs.length} ad configs (disabled by default)`);
}

// ---------------------------------------------------------------------------
// App version rows
// ---------------------------------------------------------------------------
async function seedAppVersions() {
  const versions: Array<{ platform: TargetPlatform; latestVersion: string; minimumVersion: string }> = [
    { platform: TargetPlatform.ANDROID, latestVersion: '1.0.0', minimumVersion: '1.0.0' },
    { platform: TargetPlatform.IOS, latestVersion: '1.0.0', minimumVersion: '1.0.0' },
  ];

  for (const v of versions) {
    await prisma.appVersion.upsert({
      where: { platform: v.platform },
      update: {},
      create: {
        platform: v.platform,
        latestVersion: v.latestVersion,
        minimumVersion: v.minimumVersion,
        forceUpdate: false,
        maintenanceMode: false,
        storeUrl:
          v.platform === 'ANDROID'
            ? 'https://play.google.com/store/apps/details?id=com.gamesphere.viral.ai.photo.prompt.app'
            : 'https://apps.apple.com/app/id0000000000',
      },
    });
  }
  console.log(`✅ Seeded ${versions.length} app version rows`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  await seedAdmin();
  const categories = await seedCategories();
  const aiTools = await seedAiTools();
  const tags = await seedTags();
  await seedPrompts(categories, aiTools, tags);
  await seedAppSettings();
  await seedAdConfigs();
  await seedAppVersions();

  console.log('🌱 Seeding complete.');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
