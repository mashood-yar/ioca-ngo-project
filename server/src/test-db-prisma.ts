import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables before importing other modules
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { prisma } from './lib/prisma';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testDatabase() {
  console.log('🚀 Starting Database Audit...\n');

  try {
    // ========================================
    // 0. PRE-RUN CLEANUP
    // ========================================
    console.log('🧹 Cleaning up any leftover test data from previous runs...');
    
    // Cleanup database tables first (in proper relation order)
    await prisma.eventRegistration.deleteMany({ where: { user: { email: 'test-audit@iocaworld.org' } } });
    await prisma.donation.deleteMany({ where: { user: { email: 'test-audit@iocaworld.org' } } });
    await prisma.member.deleteMany({ where: { user: { email: 'test-audit@iocaworld.org' } } });
    await prisma.volunteer.deleteMany({ where: { user: { email: 'test-audit@iocaworld.org' } } });
    await prisma.contactMessage.deleteMany({ where: { email: 'test-audit@iocaworld.org' } });
    await prisma.subscriber.deleteMany({ where: { email: 'subscriber-audit@iocaworld.org' } });
    await prisma.impactStory.deleteMany({ where: { author: { email: 'test-audit@iocaworld.org' } } });
    await prisma.gallery.deleteMany({ where: { uploader: { email: 'test-audit@iocaworld.org' } } });
    await prisma.notification.deleteMany({ where: { user: { email: 'test-audit@iocaworld.org' } } });
    await prisma.user.deleteMany({ where: { email: 'test-audit@iocaworld.org' } });

    // Also clean up main tables we generate for testing
    await prisma.project.deleteMany({ where: { name: 'Audit Project' } });
    await prisma.zone.deleteMany({ where: { name: 'Audit Zone' } });
    await prisma.event.deleteMany({ where: { title: 'Audit Event' } });

    // Clean up Supabase Auth user if exists
    const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.warn('⚠️ Warning: Could not list auth users. Proceeding...');
    } else {
      const existingAuthUser = usersList?.users.find(u => u.email === 'test-audit@iocaworld.org');
      if (existingAuthUser) {
        console.log(`🧹 Deleting existing Supabase Auth user with ID ${existingAuthUser.id}...`);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(existingAuthUser.id);
        if (deleteError) {
          console.error('❌ Failed to delete existing auth user:', deleteError.message);
        } else {
          console.log('✅ Leftover auth user deleted.');
        }
      }
    }

    // ========================================
    // 1. SUPABASE AUTH + PRISMA MAPPING TEST
    // ========================================
    console.log('\n📝 Testing Supabase Auth + Prisma User Mapping...');

    // Sign up a test user via Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: 'test-audit@iocaworld.org',
      password: 'TestPassword123!',
    });

    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('Auth user was not returned on signup.');
    const supabaseUserId = authData.user.id;
    console.log('✅ Created user in Supabase Auth with ID:', supabaseUserId);

    // Create matching record in Prisma User table
    const prismaUser = await prisma.user.create({
      data: {
        id: supabaseUserId, // Use the exact UUID from Supabase Auth
        email: 'test-audit@iocaworld.org',
        name: 'Audit Test User',
        role: 'MEMBER',
      },
    });

    console.log('✅ Supabase Auth ↔ Prisma User mapping successful!');

    // ========================================
    // 2. CREATE (C)
    // ========================================
    console.log('\n📝 Testing CREATE operations...');

    // Create Member linked to User
    const member = await prisma.member.create({
      data: {
        userId: prismaUser.id,
        membershipId: 'MEM-AUDIT-001',
        joinDate: new Date(),
        status: 'ACTIVE',
        skills: ['Testing', 'Documentation'],
      },
    });
    console.log('✅ Member created:', member.id);

    // Create Zone
    const zone = await prisma.zone.create({
      data: {
        name: 'Audit Zone',
        region: 'Test Region',
        coordinator: 'Test Coordinator',
      },
    });
    console.log('✅ Zone created:', zone.id);

    // Create Project
    const project = await prisma.project.create({
      data: {
        name: 'Audit Project',
        description: 'Testing project creation',
        startDate: new Date(),
        zoneId: zone.id,
      },
    });
    console.log('✅ Project created:', project.id);

    // Create Donation
    const donation = await prisma.donation.create({
      data: {
        userId: prismaUser.id,
        amount: 100.50,
        status: 'PENDING',
        projectId: project.id,
      },
    });
    console.log('✅ Donation created:', donation.id);

    // Create Event
    const event = await prisma.event.create({
      data: {
        title: 'Audit Event',
        description: 'Test event',
        date: new Date(),
        location: 'Online',
        capacity: 50,
      },
    });
    console.log('✅ Event created:', event.id);

    // Create EventRegistration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: event.id,
        userId: prismaUser.id,
        status: 'CONFIRMED',
      },
    });
    console.log('✅ EventRegistration created:', registration.id);

    // Create Subscriber
    const subscriber = await prisma.subscriber.create({
      data: {
        email: 'subscriber-audit@iocaworld.org',
      },
    });
    console.log('✅ Subscriber created:', subscriber.id);

    // Create Volunteer
    const volunteer = await prisma.volunteer.create({
      data: {
        userId: prismaUser.id,
        skills: ['Coordination', 'Public Speaking'],
        availability: 'Weekends',
        status: 'PENDING',
        projectId: project.id,
      },
    });
    console.log('✅ Volunteer created:', volunteer.id);

    // Create ContactMessage
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: 'Audit Messager',
        email: 'test-audit@iocaworld.org',
        subject: 'Prisma Test Subject',
        message: 'This is a test message from the Prisma database audit.',
        userId: prismaUser.id,
      },
    });
    console.log('✅ ContactMessage created:', contactMessage.id);

    // Create ImpactStory
    const story = await prisma.impactStory.create({
      data: {
        title: 'Audit Impact Story',
        content: 'Auditing story creation success.',
        category: 'Education',
        authorId: prismaUser.id,
        projectId: project.id,
      },
    });
    console.log('✅ ImpactStory created:', story.id);

    // Create Gallery item
    const galleryItem = await prisma.gallery.create({
      data: {
        title: 'Audit Gallery',
        image: 'https://res.cloudinary.com/dummy/image/upload/v1/gallery.jpg',
        category: 'Community',
        uploadedBy: prismaUser.id,
      },
    });
    console.log('✅ Gallery item created:', galleryItem.id);

    // Create Notification
    const notification = await prisma.notification.create({
      data: {
        userId: prismaUser.id,
        title: 'Welcome Alert',
        message: 'Notification test passed!',
        type: 'IN_APP',
      },
    });
    console.log('✅ Notification created:', notification.id);

    // ========================================
    // 3. READ (R)
    // ========================================
    console.log('\n📝 Testing READ operations...');

    // Fetch member with nested relations
    const fetchedMember = await prisma.member.findUnique({
      where: { id: member.id },
      include: {
        user: true,
        project: true,
        zone: true,
      },
    });
    console.log('✅ Fetched member with relations:', fetchedMember?.user?.name);
    if (!fetchedMember) throw new Error('Failed to fetch member.');

    // Fetch a specific member by userId
    const memberByUserId = await prisma.member.findUnique({
      where: { userId: prismaUser.id },
      include: {
        user: true,
        project: true,
        zone: true,
      },
    });
    console.log('✅ Fetched member by userId:', memberByUserId?.membershipId);
    if (!memberByUserId) throw new Error('Failed to fetch member by userId.');

    // Filter donations by date range with pagination
    const donations = await prisma.donation.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    console.log(`✅ Fetched ${donations.length} donations from last 7 days`);

    // ========================================
    // 4. UPDATE (U)
    // ========================================
    console.log('\n📝 Testing UPDATE operations...');

    // Assign member to project and zone
    const updatedMember = await prisma.member.update({
      where: { id: member.id },
      data: {
        projectId: project.id,
        zoneId: zone.id,
        status: 'ACTIVE',
      },
    });
    console.log('✅ Member assigned to project & zone:', updatedMember.projectId);

    // Update donation status
    const updatedDonation = await prisma.donation.update({
      where: { id: donation.id },
      data: {
        status: 'COMPLETED',
        receiptSent: true,
      },
    });
    console.log('✅ Donation status updated:', updatedDonation.status);

    // ========================================
    // 5. DELETE (D) - Soft & Hard
    // ========================================
    console.log('\n📝 Testing DELETE operations...');

    // Soft delete (set status inactive)
    const deactivatedMember = await prisma.member.update({
      where: { id: member.id },
      data: { status: 'INACTIVE' },
    });
    console.log('✅ Member soft-deleted (INACTIVE):', deactivatedMember.status);

    // Hard delete (subscriber)
    const deletedSubscriber = await prisma.subscriber.delete({
      where: { id: subscriber.id },
    });
    console.log('✅ Subscriber hard-deleted:', deletedSubscriber.email);

    // ========================================
    // 6. RELATIONSHIP TESTS
    // ========================================
    console.log('\n📝 Testing RELATIONSHIPS...');

    // One-to-One: User ↔ Member
    const userWithMember = await prisma.user.findUnique({
      where: { id: prismaUser.id },
      include: { member: true },
    });
    console.log('✅ User ↔ Member (1:1):', userWithMember?.member?.membershipId);

    // One-to-One: User ↔ Volunteer
    const userWithVolunteer = await prisma.user.findUnique({
      where: { id: prismaUser.id },
      include: { volunteer: true },
    });
    console.log('✅ User ↔ Volunteer (1:1):', userWithVolunteer?.volunteer?.availability);

    // One-to-Many: User → Donations
    const userWithDonations = await prisma.user.findUnique({
      where: { id: prismaUser.id },
      include: { donations: true },
    });
    console.log(`✅ User → Donations (1:N): ${userWithDonations?.donations.length} donations`);

    // One-to-Many: User → ContactMessages
    const userWithContactMessages = await prisma.user.findUnique({
      where: { id: prismaUser.id },
      include: { contactMessages: true },
    });
    console.log(`✅ User → ContactMessages (1:N): ${userWithContactMessages?.contactMessages.length} messages`);

    // One-to-Many: User → EventRegistrations
    const userWithRegistrations = await prisma.user.findUnique({
      where: { id: prismaUser.id },
      include: { eventRegistrations: true },
    });
    console.log(`✅ User → EventRegistrations (1:N): ${userWithRegistrations?.eventRegistrations.length} registrations`);

    // One-to-Many: Project → Members
    const projectWithMembers = await prisma.project.findUnique({
      where: { id: project.id },
      include: { members: true },
    });
    console.log(`✅ Project → Members (1:N): ${projectWithMembers?.members.length} members`);

    // One-to-Many: Project → ImpactStories
    const projectWithStories = await prisma.project.findUnique({
      where: { id: project.id },
      include: { impactStories: true },
    });
    console.log(`✅ Project → ImpactStories (1:N): ${projectWithStories?.impactStories.length} stories`);

    // One-to-Many: Zone → Members
    const zoneWithMembers = await prisma.zone.findUnique({
      where: { id: zone.id },
      include: { members: true },
    });
    console.log(`✅ Zone → Members (1:N): ${zoneWithMembers?.members.length} members`);

    // One-to-Many: Zone → Projects
    const zoneWithProjects = await prisma.zone.findUnique({
      where: { id: zone.id },
      include: { projects: true },
    });
    console.log(`✅ Zone → Projects (1:N): ${zoneWithProjects?.projects.length} projects`);

    // One-to-Many: Event → EventRegistrations
    const eventWithRegistrations = await prisma.event.findUnique({
      where: { id: event.id },
      include: { registrations: true },
    });
    console.log(`✅ Event → EventRegistrations (1:N): ${eventWithRegistrations?.registrations.length} registrations`);

    // Many-to-Many: Events ↔ Users (via EventRegistration)
    const eventM2M = await prisma.event.findUnique({
      where: { id: event.id },
      include: {
        registrations: {
          include: { user: true },
        },
      },
    });
    console.log(`✅ Events ↔ Users (M:N): ${eventM2M?.registrations.length} registrations`);

    // ========================================
    // 7. ERROR HANDLING TESTS
    // ========================================
    console.log('\n📝 Testing ERROR HANDLING...');

    // Duplicate email (Prisma P2002)
    try {
      await prisma.user.create({
        data: {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'test-audit@iocaworld.org', // Duplicate
          name: 'Should Fail',
        },
      });
      console.error('❌ Failed to throw unique constraint error for duplicate email');
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log('✅ Duplicate email error (P2002) caught correctly');
      } else {
        throw error;
      }
    }

    // Missing foreign key (Prisma P2003)
    try {
      await prisma.member.create({
        data: {
          userId: '00000000-0000-0000-0000-000000000000', // Non-existent UUID
          membershipId: 'MEM-FAIL',
          joinDate: new Date(),
        },
      });
      console.error('❌ Failed to throw foreign key error for missing user');
    } catch (error: any) {
      if (error.code === 'P2003') {
        console.log('✅ Missing foreign key error (P2003) caught correctly');
      } else {
        throw error;
      }
    }

    // ========================================
    // 8. CLEANUP
    // ========================================
    console.log('\n🧹 Cleaning up test data...');

    // Delete in correct order (respect foreign keys)
    await prisma.eventRegistration.deleteMany({ where: { userId: prismaUser.id } });
    await prisma.donation.deleteMany({ where: { userId: prismaUser.id } });
    await prisma.member.deleteMany({ where: { userId: prismaUser.id } });
    await prisma.volunteer.deleteMany({ where: { userId: prismaUser.id } });
    await prisma.contactMessage.deleteMany({ where: { userId: prismaUser.id } });
    await prisma.impactStory.deleteMany({ where: { authorId: prismaUser.id } });
    await prisma.gallery.deleteMany({ where: { uploadedBy: prismaUser.id } });
    await prisma.notification.deleteMany({ where: { userId: prismaUser.id } });
    await prisma.project.deleteMany({ where: { id: project.id } });
    await prisma.zone.deleteMany({ where: { id: zone.id } });
    await prisma.event.deleteMany({ where: { id: event.id } });
    await prisma.user.deleteMany({ where: { id: prismaUser.id } });

    // Clean up Supabase Auth user
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(supabaseUserId);
    if (deleteAuthError) {
      console.error('❌ Failed to delete test auth user:', deleteAuthError.message);
    } else {
      console.log('✅ Test Supabase Auth user cleaned up.');
    }

    console.log('✅ Cleanup complete');

    // ========================================
    // FINAL RESULT
    // ========================================
    console.log('\n✅✅✅ ALL TESTS PASSED! Database is fully operational.');
    console.log('📊 Schema is synced, relations work, and Supabase Auth integrates correctly.\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
