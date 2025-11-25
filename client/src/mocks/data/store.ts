/**
 * In-memory data store for mock data
 * Provides CRUD operations and query support
 */

import type { hospital, HospitalPackage, appointment, Profile, UserRole } from '@shared/types/database.types';
import type { Product, Article } from '@shared/types/app.types';
import type { HospitalReview } from '@shared/types/review.types';
import type { GalleryImage } from '@shared/types/gallery.types';
import {
  generateMockHospitals,
  generateMockHospitalPackages,
  generateMockAppointments,
  generateMockProfiles,
  generateMockUserRoles,
  generateMockProducts,
  generateMockArticles,
  generateMockReviews,
  generateMockGalleryImages,
  generateMockPayments,
  type Payment,
} from './generators';

class MockDataStore {
  // Data storage
  private hospitals: hospital[] = [];
  private hospitalPackages: HospitalPackage[] = [];
  private appointments: appointment[] = [];
  private profiles: Profile[] = [];
  private userRoles: UserRole[] = [];
  private products: Product[] = [];
  private articles: Article[] = [];
  private reviews: HospitalReview[] = [];
  private galleryImages: GalleryImage[] = [];
  private payments: Payment[] = [];

  // Initialize with mock data
  constructor() {
    this.initialize();
  }

  /**
   * Initialize store with mock data
   */
  private initialize() {
    // Generate users first (needed for relationships)
    this.profiles = generateMockProfiles(20);
    this.userRoles = this.profiles.map((profile) => ({
      user_id: profile.user_id,
      role: 'authenticated' as const,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }));

    // Add some partners and admins
    const partnerCount = 5;
    const adminCount = 2;
    for (let i = 0; i < partnerCount; i++) {
      const profile = this.profiles[i];
      this.userRoles.push({
        user_id: profile.user_id,
        role: 'partner' as const,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      });
    }
    for (let i = partnerCount; i < partnerCount + adminCount; i++) {
      const profile = this.profiles[i];
      this.userRoles.push({
        user_id: profile.user_id,
        role: 'admin' as const,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      });
    }

    // Generate hospitals
    this.hospitals = generateMockHospitals(15);
    const hospitalIds = this.hospitals.map((h) => h.id);

    // Generate hospital packages
    this.hospitalPackages = generateMockHospitalPackages(hospitalIds, 3);
    const packageIds = this.hospitalPackages.map((p) => p.id);
    const packageNames = this.hospitalPackages.map((p) => p.name);
    const packageTypes = this.hospitalPackages.map((p) => p.package_type);

    // Generate appointments
    const userIds = this.profiles.map((p) => p.user_id);
    this.appointments = generateMockAppointments(
      userIds,
      hospitalIds,
      packageIds,
      packageNames,
      packageTypes,
      30
    );

    // Generate other entities
    this.products = generateMockProducts(25);
    this.articles = generateMockArticles(20);
    this.reviews = generateMockReviews(hospitalIds, userIds, 40);
    this.galleryImages = generateMockGalleryImages(hospitalIds, 5);
    this.payments = generateMockPayments(userIds, 50);
  }

  // Hospitals
  getHospitals(): hospital[] {
    return [...this.hospitals];
  }

  getHospitalById(id: string): hospital | undefined {
    return this.hospitals.find((h) => h.id === id);
  }

  getHospitalBySlug(slug: string): hospital | undefined {
    return this.hospitals.find((h) => h.slug === slug);
  }

  // Hospital Packages
  getHospitalPackages(): HospitalPackage[] {
    return [...this.hospitalPackages];
  }

  getHospitalPackagesByHospitalId(hospitalId: string): HospitalPackage[] {
    return this.hospitalPackages.filter((p) => p.hospital_id === hospitalId);
  }

  getHospitalPackageById(id: string): HospitalPackage | undefined {
    return this.hospitalPackages.find((p) => p.id === id);
  }

  // Appointments
  getAppointments(): appointment[] {
    return [...this.appointments];
  }

  getAppointmentById(id: string): appointment | undefined {
    return this.appointments.find((a) => a.id === id);
  }

  getAppointmentsByUserId(userId: string): appointment[] {
    return this.appointments.filter((a) => a.user_id === userId);
  }

  getAppointmentsByHospitalId(hospitalId: string): appointment[] {
    return this.appointments.filter((a) => a.hospital_id === hospitalId);
  }

  // Profiles
  getProfiles(): Profile[] {
    return [...this.profiles];
  }

  getProfileByUserId(userId: string): Profile | undefined {
    return this.profiles.find((p) => p.user_id === userId);
  }

  // User Roles
  getUserRoles(): UserRole[] {
    return [...this.userRoles];
  }

  getUserRoleByUserId(userId: string): UserRole | undefined {
    return this.userRoles.find((r) => r.user_id === userId);
  }

  // Products
  getProducts(): Product[] {
    return [...this.products];
  }

  getProductById(id: string | number): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  getProductBySlug(slug: string): Product | undefined {
    return this.products.find((p) => p.slug === slug);
  }

  // Articles
  getArticles(): Article[] {
    return [...this.articles];
  }

  getArticleById(id: string): Article | undefined {
    return this.articles.find((a) => a.id === id);
  }

  getArticleBySlug(slug: string): Article | undefined {
    return this.articles.find((a) => a.slug === slug);
  }

  // Reviews
  getReviews(): HospitalReview[] {
    return [...this.reviews];
  }

  getReviewById(id: string): HospitalReview | undefined {
    return this.reviews.find((r) => r.id === id);
  }

  getReviewsByHospitalId(hospitalId: string): HospitalReview[] {
    return this.reviews.filter((r) => r.hospital_id === hospitalId);
  }

  getReviewsByUserId(userId: string): HospitalReview[] {
    return this.reviews.filter((r) => r.user_id === userId);
  }

  // Gallery Images
  getGalleryImages(): GalleryImage[] {
    return [...this.galleryImages];
  }

  getGalleryImageById(id: string): GalleryImage | undefined {
    return this.galleryImages.find((img) => img.id === id);
  }

  getGalleryImagesByHospitalId(hospitalId: string): GalleryImage[] {
    return this.galleryImages.filter((img) => img.hospital_id === hospitalId);
  }

  // Payments
  getPayments(): Payment[] {
    return [...this.payments];
  }

  getPaymentById(id: string): Payment | undefined {
    return this.payments.find((p) => p.id === id);
  }

  getPaymentsByUserId(userId: string): Payment[] {
    return this.payments.filter((p) => p.user_id === userId);
  }

  // Reset store (useful for testing)
  reset() {
    this.initialize();
  }
}

// Singleton instance
export const mockDataStore = new MockDataStore();

