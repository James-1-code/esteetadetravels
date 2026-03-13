# Live Fixes TODO

## Phase 1: Remove Demo Data
- [ ] Create database cleanup script to remove all seeded demo data
- [ ] Include: users, applications, invoices, notifications

## Phase 2: Fix Referral Code
- [ ] Fix referral code validation in auth.js to be case-insensitive
- [ ] Ensure agent approval check works properly

## Phase 3: Fix Agent Approval/Rejection
- [ ] Fix admin users page to properly handle status updates
- [ ] Ensure notifications are sent on approve/reject

## Phase 4: Landing Page Contact Info
- [ ] Update Footer.tsx with new contact details:
  - Email: esteetadetravels@gmail.com
  - Phone: +2349059100967
  - Address: Ibadan, Nigeria

## Phase 5: Real-time Notifications & Socket.io
- [ ] Ensure socket.io is properly initialized in backend
- [ ] Add socket emission when application status changes
- [ ] Add socket emission when agent is approved/rejected

## Phase 6: Application Timeline Real-time Updates
- [ ] Update TrackPage to fetch latest status from API
- [ ] Add polling or socket listener for status updates

## Phase 7: Agent-Client Visibility
- [ ] Ensure clients can see their agent in profile/applications
- [ ] Ensure agents can see their clients
- [ ] Ensure admin can see all relationships

