/**
 * Mock hospital data generator
 */

import { faker } from '@faker-js/faker';
import type { hospital, HospitalPackage } from '@shared/types/database.types';
import type { HospitalType, HospitalStatus } from '@shared/types/app.types';

/**
 * Generate mock hospital
 */
export function generateMockHospital(overrides?: Partial<hospital>): hospital {
  const hospitalName = faker.company.name();
  const hospitalNameEnglish = faker.company.name();
  const slug = faker.helpers.slugify(hospitalName.toLowerCase());
  const status: HospitalStatus = faker.helpers.arrayElement(['pending', 'approved', 'rejected']);
  const hospitalType: HospitalType = faker.helpers.arrayElement([
    'general',
    'specialized',
    'clinic',
    'Professional',
  ]);

  return {
    id: faker.string.uuid(),
    slug: slug,
    hospital_name: hospitalName,
    hospital_name_english: hospitalNameEnglish,
    address: faker.location.streetAddress(true),
    hospital_details: faker.lorem.paragraphs(3),
    hospital_type: hospitalType,
    images: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () =>
      faker.image.url()
    ),
    phone: faker.phone.number('0##-###-####'),
    email: faker.internet.email(),
    website: faker.internet.url(),
    socials: JSON.stringify({
      facebook: faker.internet.url(),
      instagram: faker.internet.url(),
    }),
    contact_name: faker.person.fullName(),
    location: `${faker.location.city()}, ${faker.location.state()}`,
    map_url: `https://maps.google.com/?q=${faker.location.latitude()},${faker.location.longitude()}`,
    latitude: faker.location.latitude(),
    longitude: faker.location.longitude(),
    google_place_id: faker.string.alphanumeric(27),
    services: faker.helpers.arrayElements(
      [
        'ตรวจสุขภาพ',
        'ตรวจเลือด',
        'X-Ray',
        'อัลตราซาวด์',
        'ตรวจหัวใจ',
        'ตรวจตา',
        'ตรวจฟัน',
      ],
      { min: 2, max: 5 }
    ),
    opening_hours: '09:00 - 18:00',
    price: faker.number.int({ min: 500, max: 5000 }).toString(),
    usage_details: faker.lorem.sentence(),
    status: status,
    id_card_url: faker.image.url(),
    id_card_original_url: faker.image.url(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Generate mock hospital package
 */
export function generateMockHospitalPackage(
  hospitalId: string,
  overrides?: Partial<HospitalPackage>
): HospitalPackage {
  const packageType = faker.helpers.arrayElement(['one_time', 'package']);
  const name = faker.commerce.productName();
  const durationMonths =
    packageType === 'package'
      ? faker.helpers.arrayElement([1, 3, 6, 12])
      : null;

  return {
    id: faker.string.uuid(),
    hospital_id: hospitalId,
    package_type: packageType,
    name: name,
    name_english: faker.commerce.productName(),
    description: faker.lorem.paragraph(),
    price: faker.number.float({ min: 500, max: 10000, fractionDigits: 2 }),
    duration_months: durationMonths,
    features: faker.helpers.arrayElements(
      [
        'ตรวจสุขภาพครบวงจร',
        'รายงานผลละเอียด',
        'ปรึกษาแพทย์',
        'อาหารเสริม',
        'ติดตามผล',
      ],
      { min: 2, max: 5 }
    ),
    is_active: faker.datatype.boolean({ probability: 0.8 }),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Generate multiple mock hospitals
 */
export function generateMockHospitals(count: number = 10): hospital[] {
  return Array.from({ length: count }, () => generateMockHospital());
}

/**
 * Generate multiple mock hospital packages
 */
export function generateMockHospitalPackages(
  hospitalIds: string[],
  packagesPerHospital: number = 3
): HospitalPackage[] {
  const packages: HospitalPackage[] = [];
  hospitalIds.forEach((hospitalId) => {
    for (let i = 0; i < packagesPerHospital; i++) {
      packages.push(generateMockHospitalPackage(hospitalId));
    }
  });
  return packages;
}

