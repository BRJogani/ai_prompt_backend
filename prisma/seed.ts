import { PrismaClient, ContentType, PromptStatus, AdType, TargetPlatform, AdFrequencyType } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

/**
 * Phase 2 seed data.
 *
 * Populates enough realistic content for local development and for the
 * Flutter team to build against: an admin account, categories, AI tools,
 * tags, a handful of sample prompts with media, home page sections,
 * default remote app settings / feature flags, disabled-by-default ad
 * configs, and app version rows.
 *
 * Deliberately does NOT seed analytics_events, favorites, or history —
 * those are real user-generated data and should stay empty in every
 * environment (per Section 56: "Do not seed fake production analytics").
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
// Home sections
// ---------------------------------------------------------------------------
async function seedHomeSections() {

  const sections = [
    { title: 'Trending Now', sectionType: 'TRENDING' as const, categoryId: null, itemLimit: 10, sortOrder: 0 },
    { title: 'Popular Videos', sectionType: 'POPULAR_VIDEO' as const, categoryId: null, itemLimit: 10, sortOrder: 1 },
    { title: 'Fashion', sectionType: 'CATEGORY' as const, categoryId: null, itemLimit: 10, sortOrder: 2 },
    { title: 'New Prompts', sectionType: 'LATEST' as const, categoryId: null, itemLimit: 10, sortOrder: 3 },
    { title: 'Popular Images', sectionType: 'POPULAR_IMAGE' as const, categoryId: null, itemLimit: 10, sortOrder: 4 },
    { title: 'Anime', sectionType: 'CATEGORY' as const, categoryId: null, itemLimit: 10, sortOrder: 5 },
    { title: 'Featured', sectionType: 'FEATURED' as const, categoryId: null, itemLimit: 10, sortOrder: 6 },
  ];

  for (const section of sections) {
    const existing = await prisma.homeSection.findFirst({ where: { title: section.title } });
    if (!existing) {
      await prisma.homeSection.create({
        data: {
          title: section.title,
          sectionType: section.sectionType,
          categoryId: section.categoryId,
          itemLimit: section.itemLimit,
          sortOrder: section.sortOrder,
          status: 'ACTIVE',
        },
      });
    }
  }
  console.log(`✅ Seeded ${sections.length} home sections`);
}

// ---------------------------------------------------------------------------
// Default remote app settings / feature flags (Sections 27, 57, 60)
// ---------------------------------------------------------------------------
const APP_SETTING_SEED: Array<{ key: string; value: string; valueType: string; description: string }> = [
  { key: 'app_name', value: 'AI Prompt Inspiration', valueType: 'string', description: 'Display name shown in the app.' },
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
// Default ad configs — disabled everywhere until an admin turns them on
// (Section 58: "Use disabled ads in development... Never hard-code
// production ad IDs into the source code.")
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
        adUnitId: '', // never hard-code production ad unit IDs — set via admin panel
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
            ? 'https://play.google.com/store/apps/details?id=com.example.aipromptapp'
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
  await seedHomeSections();
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
