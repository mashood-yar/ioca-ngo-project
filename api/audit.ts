import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './_lib/prisma';
import { supabase } from './_lib/supabase';
import { cors } from './_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const logs: string[] = [];
  const log = (...args: any[]) => {
    const line = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    logs.push(line);
    console.log(line);
  };

  log('🚀 Starting Database Audit inside Vercel Serverless Environment...\n');

  try {
    // ========================================
    // 0. PRE-RUN CLEANUP
    // ========================================
    log('🧹 Cleaning up any leftover test data...');
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

    await prisma.project.deleteMany({ where: { name: 'Audit Project' } });
    await prisma.zone.deleteMany({ where: { name: 'Audit Zone' } });
    await prisma.event.deleteMany({ where: { title: 'Audit Event' } });

    // Clean up Supabase Auth user if exists
    const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
    if (!listError) {
      const existingAuthUser = usersList?.users.find(u => u.email === 'test-audit@iocaworld.org');
      if (existingAuthUser) {
        log(`🧹 Deleting existing Supabase Auth user: ${existingAuthUser.id}...`);
        await supabase.auth.admin.deleteUser(existingAuthUser.id);
      }
    }

    // ========================================
    // 1. SUPABASE AUTH + PRISMA MAPPING TEST
    // ========================================
    log('\n📝 Testing Supabase Auth + Prisma User Mapping...');
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: 'test-audit@iocaworld.org',
      password: 'TestPassword123!',
    });

    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('Auth user was not returned on signup.');
    const supabaseUserId = authData.user.id;
    log('✅ Created user in Supabase Auth with ID:', supabaseUserId);

    const prismaUser = await prisma.user.create({
      data: {
        id: supabaseUserId,
        email: 'test-audit@iocaworld.org',
        name: 'Audit Test User',
        role: 'MEMBER',
      },
    });
    log('✅ Supabase Auth ↔ Prisma User mapping successful!');

    // ========================================
    // 2. CREATE (C)
    // ========================================
    log('\n📝 Testing CREATE operations...');
    const member = await prisma.member.create({
      data: {
        userId: prismaUser.id,
        membershipId: 'MEM-AUDIT-001',
        joinDate: new Date(),
        status: 'ACTIVE',
        skills: ['Testing', 'Documentation'],
      },
    });
    log('✅ Member created:', member.id);

    const zone = await prisma.zone.create({
      data: {
        name: 'Audit Zone',
        region: 'Test Region',
        coordinator: 'Test Coordinator',
      },
    });
    log('✅ Zone created:', zone.id);

    const project = await prisma.project.create({
      data: {
        name: 'Audit Project',
        description: 'Testing project creation',
        startDate: new Date(),
        zoneId: zone.id,
      },
    });
    log('✅ Project created:', project.id);

    const donation = await prisma.donation.create({
      data: {
        userId: prismaUser.id,
        amount: 100.50,
        status: 'PENDING',
        projectId: project.id,
      },
    });
    log('✅ Donation created:', donation.id);

    const event = await prisma.event.create({
      data: {
        title: 'Audit Event',
        description: 'Test event',
        date: new Date(),
        location: 'Online',
        capacity: 50,
      },
    });
    log('✅ Event created:', event.id);

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: event.id,
        userId: prismaUser.id,
        status: 'CONFIRMED',
      },
    });
    log('✅ EventRegistration created:', registration.id);

    const subscriber = await prisma.subscriber.create({
      data: {
        email: 'subscriber-audit@iocaworld.org',
      },
    });
    log('✅ Subscriber created:', subscriber.id);

    const volunteer = await prisma.volunteer.create({
      data: {
        userId: prismaUser.id,
        skills: ['Coordination', 'Public Speaking'],
        availability: 'Weekends',
        status: 'PENDING',
        projectId: project.id,
      },
    });
    log('✅ Volunteer created:', volunteer.id);

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: 'Audit Messager',
        email: 'test-audit@iocaworld.org',
        subject: 'Prisma Test Subject',
        message: 'This is a test message from the Prisma database audit.',
        userId: prismaUser.id,
      },
    });
    log('✅ ContactMessage created:', contactMessage.id);

    const story = await prisma.impactStory.create({
      data: {
        title: 'Audit Impact Story',
        content: 'Auditing story creation success.',
        category: 'Education',
        authorId: prismaUser.id,
        projectId: project.id,
      },
    });
    log('✅ ImpactStory created:', story.id);

    const galleryItem = await prisma.gallery.create({
      data: {
        title: 'Audit Gallery',
        image: 'https://res.cloudinary.com/dummy/image/upload/v1/gallery.jpg',
        category: 'Community',
        uploadedBy: prismaUser.id,
      },
    });
    log('✅ Gallery item created:', galleryItem.id);

    const notification = await prisma.notification.create({
      data: {
        userId: prismaUser.id,
        title: 'Welcome Alert',
        message: 'Notification test passed!',
        type: 'IN_APP',
      },
    });
    log('✅ Notification created:', notification.id);

    // ========================================
    // 3. READ (R)
    // ========================================
    log('\n📝 Testing READ operations...');
    const fetchedMember = await prisma.member.findUnique({
      where: { id: member.id },
      include: {
        user: true,
        project: true,
        zone: true,
      },
    });
    log('✅ Fetched member with relations:', fetchedMember?.user?.name);

    const memberByUserId = await prisma.member.findUnique({
      where: { userId: prismaUser.id },
      include: { user: true },
    });
    log('✅ Fetched member by userId:', memberByUserId?.membershipId);

    const donations = await prisma.donation.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    log(`✅ Fetched ${donations.length} donations from last 7 days`);

    // ========================================
    // 4. UPDATE (U)
    // ========================================
    log('\n📝 Testing UPDATE operations...');
    const updatedMember = await prisma.member.update({
      where: { id: member.id },
      data: {
        projectId: project.id,
        zoneId: zone.id,
        status: 'ACTIVE',
      },
    });
    log('✅ Member assigned to project & zone:', updatedMember.projectId);

    const updatedDonation = await prisma.donation.update({
      where: { id: donation.id },
      data: {
        status: 'COMPLETED',
        receiptSent: true,
      },
    });
    log('✅ Donation status updated:', updatedDonation.status);

    // ========================================
    // 5. DELETE (D) - Soft & Hard
    // ========================================
    log('\n📝 Testing DELETE operations...');
    const deactivatedMember = await prisma.member.update({
      where: { id: member.id },
      data: { status: 'INACTIVE' },
    });
    log('✅ Member soft-deleted (INACTIVE):', deactivatedMember.status);

    const deletedSubscriber = await prisma.subscriber.delete({
      where: { id: subscriber.id },
    });
    log('✅ Subscriber hard-deleted:', deletedSubscriber.email);

    // ========================================
    // 6. RELATIONSHIP TESTS
    // ========================================
    log('\n📝 Testing RELATIONSHIPS...');
    const userWithMember = await prisma.user.findUnique({
      where: { id: prismaUser.id },
      include: { member: true },
    });
    log('✅ User ↔ Member (1:1):', userWithMember?.member?.membershipId);

    const userWithVolunteer = await prisma.user.findUnique({
      where: { id: prismaUser.id },
      include: { volunteer: true },
    });
    log('✅ User ↔ Volunteer (1:1):', userWithVolunteer?.volunteer?.availability);

    const userWithDonations = await prisma.user.findUnique({
      where: { id: prismaUser.id },
      include: { donations: true },
    });
    log(`✅ User → Donations (1:N): ${userWithDonations?.donations.length} donations`);

    const projectWithMembers = await prisma.project.findUnique({
      where: { id: project.id },
      include: { members: true },
    });
    log(`✅ Project → Members (1:N): ${projectWithMembers?.members.length} members`);

    const eventM2M = await prisma.event.findUnique({
      where: { id: event.id },
      include: { registrations: { include: { user: true } } },
    });
    log(`✅ Events ↔ Users (M:N): ${eventM2M?.registrations.length} registrations`);

    // ========================================
    // 7. ERROR HANDLING TESTS
    // ========================================
    log('\n📝 Testing ERROR HANDLING...');
    try {
      await prisma.user.create({
        data: {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'test-audit@iocaworld.org',
          name: 'Should Fail',
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        log('✅ Duplicate email error (P2002) caught correctly');
      } else {
        throw error;
      }
    }

    try {
      await prisma.member.create({
        data: {
          userId: '00000000-0000-0000-0000-000000000000',
          membershipId: 'MEM-FAIL',
          joinDate: new Date(),
        },
      });
    } catch (error: any) {
      if (error.code === 'P2003') {
        log('✅ Missing foreign key error (P2003) caught correctly');
      } else {
        throw error;
      }
    }

    // ========================================
    // 8. CLEANUP
    // ========================================
    log('\n🧹 Cleaning up test data...');
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

    await supabase.auth.admin.deleteUser(supabaseUserId);
    log('✅ Cleanup complete');

    log('\n✅✅✅ ALL TESTS PASSED! Database is fully operational.');

    return res.status(200).json({
      success: true,
      message: 'ALL DATABASE AUDIT TESTS PASSED!',
      logs
    });
  } catch (error: any) {
    log('\n❌ TEST FAILED:', error.message);
    return res.status(500).json({
      success: false,
      message: 'DATABASE AUDIT TEST FAILED',
      error: error.message,
      logs
    });
  }
}
