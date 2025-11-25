/**
 * Mock article data generator
 */

import { faker } from '@faker-js/faker';
import type { Article } from '@shared/types/app.types';

/**
 * Generate mock article
 */
export function generateMockArticle(overrides?: Partial<Article>): Article {
  const title = faker.lorem.sentence();
  const slug = faker.helpers.slugify(title.toLowerCase());
  const isPublished = faker.datatype.boolean({ probability: 0.8 });
  const publishedAt = isPublished ? faker.date.past() : null;

  return {
    id: faker.string.uuid(),
    slug: slug,
    title: title,
    excerpt: faker.lorem.paragraph(),
    content: faker.lorem.paragraphs(5),
    author_id: faker.string.uuid(),
    author_name: faker.person.fullName(),
    date: publishedAt ? publishedAt.toISOString() : faker.date.past().toISOString(),
    category: faker.helpers.arrayElement([
      'สุขภาพ',
      'อาหาร',
      'ออกกำลังกาย',
      'ไลฟ์สไตล์',
      'ข่าวสาร',
    ]),
    image: faker.image.url(),
    tags: faker.helpers.arrayElements(
      ['สุขภาพ', 'อาหาร', 'ออกกำลังกาย', 'ไลฟ์สไตล์', 'ข่าวสาร'],
      { min: 1, max: 3 }
    ),
    is_new: faker.datatype.boolean({ probability: 0.2 }),
    is_published: isPublished,
    published_at: publishedAt ? publishedAt.toISOString() : null,
    scheduled_publish_at: null,
    views_count: faker.number.int({ min: 0, max: 10000 }),
    likes_count: faker.number.int({ min: 0, max: 500 }),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    meta_title: title,
    meta_description: faker.lorem.sentence(),
    meta_keywords: faker.helpers.arrayElements(
      ['สุขภาพ', 'อาหาร', 'ออกกำลังกาย'],
      { min: 1, max: 3 }
    ),
    og_image: faker.image.url(),
    og_title: title,
    og_description: faker.lorem.sentence(),
    twitter_card: 'summary_large_image',
    canonical_url: `https://example.com/articles/${slug}`,
    author: faker.person.fullName(),
    isNew: faker.datatype.boolean({ probability: 0.2 }),
    ...overrides,
  };
}

/**
 * Generate multiple mock articles
 */
export function generateMockArticles(count: number = 15): Article[] {
  return Array.from({ length: count }, () => generateMockArticle());
}

