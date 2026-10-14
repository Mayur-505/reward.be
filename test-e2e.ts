import * as dns from 'node:dns';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';

// Configure public DNS resolvers to prevent querySrv ECONNREFUSED on Windows with MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore
}

async function runTests() {
  console.log('=================================================================');
  console.log('  STARTING MULTI-PROJECT REWARD ENGINE END-TO-END VERIFICATION   ');
  console.log('=================================================================\n');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const TEST_PORT = 3099;
  await app.listen(TEST_PORT);
  console.log(`[INIT] NestJS Test Instance listening on port ${TEST_PORT}\n`);

  const BASE_URL = `http://localhost:${TEST_PORT}/api`;
  const timestamp = Date.now();
  let adminToken = '';
  let projectA: any = null;
  let projectB: any = null;
  let memberAlice: any = null;
  let memberBob: any = null;
  let memberCharlie: any = null;
  let universalCouponCode = '';
  let giftCardA: any = null;
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, detail: string = '') {
    if (condition) {
      console.log(`  [PASS] ${testName} ${detail ? '(' + detail + ')' : ''}`);
      passedCount++;
    } else {
      console.error(`  [FAIL] ${testName} ${detail ? '(' + detail + ')' : ''}`);
      failedCount++;
    }
  }

  try {
    // -------------------------------------------------------------
    // STEP 1: Admin Registration & Authentication
    // -------------------------------------------------------------
    console.log('--> STEP 1: Admin Registration & JWT Authentication');
    const adminEmail = `admin_${timestamp}@reward.local`;
    const adminPassword = 'Password@1234';

    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
        name: 'Super Admin',
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, 'Admin Registration', `Status ${regRes.status}`);
    assert(!!regData.accessToken, 'Access Token Returned');

    adminToken = regData.accessToken;

    const profRes = await fetch(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const profData = await profRes.json();
    assert(profRes.status === 200, 'Profile Fetch with JWT', `Email: ${profData.email}`);

    // -------------------------------------------------------------
    // STEP 2: Multi-Tenant Project Creation
    // -------------------------------------------------------------
    console.log('\n--> STEP 2: Creating Isolated Projects (Project A & Project B)');
    const codeA = `ALPHA_${timestamp.toString().slice(-4)}`;
    const codeB = `BETA_${timestamp.toString().slice(-4)}`;

    const pARes = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Project Alpha (e.g. PocketLog)',
        code: codeA,
        description: 'First tenant app',
        settings: {
          referralRewardCoins: 50,
          refereeRewardCoins: 25,
          welcomeCoins: 10,
          currencyName: 'AlphaCoins',
        },
      }),
    });
    projectA = await pARes.json();
    assert(pARes.status === 201, 'Create Project A', `ID: ${projectA._id}, code: ${projectA.code}`);
    assert(!!projectA.apiKey && projectA.apiKey.startsWith('pk_'), 'Project A API Key generated');

    const pBRes = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Project Beta (e.g. QuizMaster)',
        code: codeB,
        description: 'Second tenant app',
        settings: {
          referralRewardCoins: 40,
          refereeRewardCoins: 20,
          welcomeCoins: 15,
          currencyName: 'BetaPoints',
        },
      }),
    });
    projectB = await pBRes.json();
    assert(pBRes.status === 201, 'Create Project B', `ID: ${projectB._id}, code: ${projectB.code}`);
    assert(projectA.apiKey !== projectB.apiKey, 'Unique API Keys per tenant');

    // -------------------------------------------------------------
    // STEP 3: Member Onboarding & Welcome Bonus (Project A)
    // -------------------------------------------------------------
    console.log('\n--> STEP 3: Member Onboarding & Welcome Bonus in Project A');
    const mARes = await fetch(`${BASE_URL}/projects/${projectA._id}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        externalUserId: `usr_alice_${timestamp}`,
        name: 'Alice Wonder',
        email: `alice_${timestamp}@example.com`,
      }),
    });
    memberAlice = await mARes.json();
    assert(mARes.status === 201, 'Onboard Alice in Project A', `MemberId: ${memberAlice._id}`);
    assert(memberAlice.coinBalance === 10, 'Welcome Bonus Awarded', `Balance: ${memberAlice.coinBalance}`);
    assert(
      memberAlice.referralCode && memberAlice.referralCode.startsWith(codeA.slice(0, 4)),
      'Project-Scoped Referral Code',
      `Code: ${memberAlice.referralCode}`,
    );

    // Verify transaction history for Alice
    const aliceTxRes = await fetch(
      `${BASE_URL}/projects/${projectA._id}/members/${memberAlice._id}/transactions`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    const aliceTxs = await aliceTxRes.json();
    assert(
      aliceTxs.length === 1 && aliceTxs[0].type === 'WELCOME_BONUS' && aliceTxs[0].amount === 10,
      'Welcome Bonus Transaction Logged in Ledger',
    );

    // -------------------------------------------------------------
    // STEP 4: Referral Engine Flow (Bob invited by Alice)
    // -------------------------------------------------------------
    console.log('\n--> STEP 4: Referral Engine Flow (Bob registers using Alice referral code)');
    const mBRes = await fetch(`${BASE_URL}/projects/${projectA._id}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        externalUserId: `usr_bob_${timestamp}`,
        name: 'Bob Builder',
        email: `bob_${timestamp}@example.com`,
        referralCode: memberAlice.referralCode,
      }),
    });
    memberBob = await mBRes.json();
    assert(mBRes.status === 201, 'Onboard Bob with Referral Code', `MemberId: ${memberBob._id}`);
    // Bob should get welcomeCoins (10) + refereeRewardCoins (25) = 35
    assert(memberBob.coinBalance === 35, 'Bob Received Welcome + Referee Bonus', `Balance: ${memberBob.coinBalance}`);

    // Alice (referrer) should receive referralRewardCoins (50), balance was 10, now 10 + 50 = 60
    const aliceUpdatedRes = await fetch(
      `${BASE_URL}/projects/${projectA._id}/members/${memberAlice._id}`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    const aliceUpdated = await aliceUpdatedRes.json();
    assert(aliceUpdated.coinBalance === 60, 'Alice Awarded 50 Referral Coins', `New Balance: ${aliceUpdated.coinBalance}`);

    // Check Alice referral stats
    const aliceStatsRes = await fetch(
      `${BASE_URL}/projects/${projectA._id}/referrals/stats/${memberAlice._id}`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    const aliceStats = await aliceStatsRes.json();
    assert(
      aliceStats.totalInvited === 1 && aliceStats.totalCoinsEarned === 50,
      'Referral Stats Accurate',
      `Invited: ${aliceStats.totalInvited}, Earned: ${aliceStats.totalCoinsEarned}`,
    );

    // -------------------------------------------------------------
    // STEP 5: Strict Multi-Tenant Data Isolation
    // -------------------------------------------------------------
    console.log('\n--> STEP 5: Verifying Strict Project Data Isolation');
    const leakCheckRes = await fetch(
      `${BASE_URL}/projects/${projectB._id}/members/${memberAlice._id}`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    assert(leakCheckRes.status === 404, 'Alice Does NOT Exist in Project B', `Status: ${leakCheckRes.status}`);

    const projectBMembersRes = await fetch(`${BASE_URL}/projects/${projectB._id}/members`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const projectBMembers = await projectBMembersRes.json();
    assert(
      Array.isArray(projectBMembers) && projectBMembers.length === 0,
      'Project B Member List is completely isolated and empty',
    );

    // -------------------------------------------------------------
    // STEP 6: Universal Coupons - Cross-Project Redemption
    // -------------------------------------------------------------
    console.log('\n--> STEP 6: Universal Coupons (Cross-Project Shared Promo Codes)');
    universalCouponCode = `GLOBAL100_${timestamp.toString().slice(-4)}`;
    const cRes = await fetch(`${BASE_URL}/coupons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        code: universalCouponCode,
        rewardCoins: 100,
        maxGlobalUses: 50,
        description: 'Universal 100 bonus coins for all projects',
      }),
    });
    const cData = await cRes.json();
    assert(cRes.status === 201, 'Create Universal Coupon', `Code: ${cData.code}, Coins: ${cData.rewardCoins}`);

    // Alice redeems coupon in Project A
    const aliceRedeemCouponRes = await fetch(
      `${BASE_URL}/projects/${projectA._id}/coupons/redeem`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          memberId: memberAlice._id,
          couponCode: universalCouponCode,
        }),
      },
    );
    const aliceRedeemData = await aliceRedeemCouponRes.json();
    assert(aliceRedeemCouponRes.status === 200, 'Alice Redeems Universal Coupon in Project A');
    assert(aliceRedeemData.newBalance === 160, 'Alice Balance Updated (+100)', `Balance: ${aliceRedeemData.newBalance}`);

    // Alice attempts duplicate redemption in Project A -> Should be rejected
    const aliceDupCouponRes = await fetch(
      `${BASE_URL}/projects/${projectA._id}/coupons/redeem`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          memberId: memberAlice._id,
          couponCode: universalCouponCode,
        }),
      },
    );
    assert(aliceDupCouponRes.status === 409, 'Duplicate Coupon Redemption Rejected in Project A', `Status: ${aliceDupCouponRes.status}`);

    // Onboard Charlie in Project B
    const mCRes = await fetch(`${BASE_URL}/projects/${projectB._id}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        externalUserId: `usr_charlie_${timestamp}`,
        name: 'Charlie Chaplin',
        email: `charlie_${timestamp}@example.com`,
      }),
    });
    memberCharlie = await mCRes.json();
    assert(mCRes.status === 201, 'Onboard Charlie in Project B', `Balance: ${memberCharlie.coinBalance}`);

    // Charlie redeems the SAME universal coupon in Project B
    const charlieRedeemCouponRes = await fetch(
      `${BASE_URL}/projects/${projectB._id}/coupons/redeem`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          memberId: memberCharlie._id,
          couponCode: universalCouponCode,
        }),
      },
    );
    const charlieRedeemData = await charlieRedeemCouponRes.json();
    assert(
      charlieRedeemCouponRes.status === 200,
      'Charlie Redeems SAME Universal Coupon in Project B (Cross-Project Shared)',
      `Awarded: ${charlieRedeemData.coinsAwarded}, New Balance: ${charlieRedeemData.newBalance}`,
    );
    assert(charlieRedeemData.newBalance === 115, 'Charlie Balance Reflects Project B Welcome (15) + Coupon (100) = 115');

    // -------------------------------------------------------------
    // STEP 7: Project-Scoped Gift Cards Catalog & Redemptions
    // -------------------------------------------------------------
    console.log('\n--> STEP 7: Project-Scoped Gift Card Catalog & Redemption');
    const gcRes = await fetch(`${BASE_URL}/projects/${projectA._id}/gift-cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: '$10 Coffee Card',
        description: 'Enjoy a warm brew',
        coinCost: 100,
        stock: 3,
      }),
    });
    giftCardA = await gcRes.json();
    assert(gcRes.status === 201, 'Create Gift Card in Project A', `Title: ${giftCardA.title}, Cost: ${giftCardA.coinCost}`);

    // Check Project B gift cards: should be empty
    const gcBRes = await fetch(`${BASE_URL}/projects/${projectB._id}/gift-cards`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const gcBList = await gcBRes.json();
    assert(Array.isArray(gcBList) && gcBList.length === 0, 'Gift Card Catalog is Isolated to Project A');

    // Alice redeems Coffee Card (Alice balance is 160, cost is 100)
    const redeemGcRes = await fetch(
      `${BASE_URL}/projects/${projectA._id}/gift-cards/${giftCardA._id}/redeem`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ memberId: memberAlice._id }),
      },
    );
    const redemptionAlice = await redeemGcRes.json();
    assert(redeemGcRes.status === 201, 'Alice Redeems Gift Card', `Redemption ID: ${redemptionAlice._id}`);
    assert(redemptionAlice.status === 'PENDING', 'Redemption Status is PENDING');

    // Verify Alice balance deducted (160 - 100 = 60)
    const alicePostRedeemRes = await fetch(
      `${BASE_URL}/projects/${projectA._id}/members/${memberAlice._id}`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    const alicePostRedeem = await alicePostRedeemRes.json();
    assert(alicePostRedeem.coinBalance === 60, 'Alice Balance Decremented by 100 Coins', `Balance: ${alicePostRedeem.coinBalance}`);

    // -------------------------------------------------------------
    // STEP 8: Admin Fulfillment & Auto-Refund on Rejection
    // -------------------------------------------------------------
    console.log('\n--> STEP 8: Admin Fulfillment & Auto-Refund on Rejection');
    // Admin approves Alice redemption with a voucher code
    const fulfillRes = await fetch(
      `${BASE_URL}/projects/${projectA._id}/gift-cards/redemptions/${redemptionAlice._id}/fulfill`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'APPROVED',
          voucherCode: 'COFFEE-ALICE-1234',
          adminNote: 'Enjoy your coffee!',
        }),
      },
    );
    const fulfilledData = await fulfillRes.json();
    assert(fulfillRes.status === 200, 'Redemption Approved with Voucher Code', `Code: ${fulfilledData.voucherCode}`);

    // Create a 2nd card for Bob and test rejection auto-refund
    const gc2Res = await fetch(`${BASE_URL}/projects/${projectA._id}/gift-cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: '$5 Quick Voucher',
        coinCost: 30,
        stock: 5,
      }),
    });
    const giftCard2 = await gc2Res.json();

    // Bob has 35 coins, redeems 30 coins card
    const bobRedeemRes = await fetch(
      `${BASE_URL}/projects/${projectA._id}/gift-cards/${giftCard2._id}/redeem`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ memberId: memberBob._id }),
      },
    );
    const bobRedemption = await bobRedeemRes.json();
    assert(bobRedeemRes.status === 201, 'Bob Redeemed Gift Card', `Status: ${bobRedemption.status}`);

    // Admin REJECTS Bob redemption -> should trigger auto-refund
    const rejectRes = await fetch(
      `${BASE_URL}/projects/${projectA._id}/gift-cards/redemptions/${bobRedemption._id}/fulfill`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'REJECTED',
          adminNote: 'Item temporarily out of stock. Coins refunded.',
        }),
      },
    );
    assert(rejectRes.status === 200, 'Admin Rejected Redemption Request');

    // Bob balance should be restored to 35
    const bobRefundedRes = await fetch(
      `${BASE_URL}/projects/${projectA._id}/members/${memberBob._id}`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    const bobRefunded = await bobRefundedRes.json();
    assert(bobRefunded.coinBalance === 35, 'Bob Coins Automatically Refunded upon Rejection', `Balance: ${bobRefunded.coinBalance}`);

    // -------------------------------------------------------------
    // STEP 9: Mobile / Client Access with `x-api-key` (No Bearer Token)
    // -------------------------------------------------------------
    console.log('\n--> STEP 9: Client Mobile Integration via `x-api-key` Header');
    // Fetch Alice's details using Project A's API key without Bearer token
    const apiKeyAuthRes = await fetch(
      `${BASE_URL}/projects/${projectA._id}/members/${memberAlice._id}`,
      {
        headers: {
          'x-api-key': projectA.apiKey,
        },
      },
    );
    const apiKeyAuthData = await apiKeyAuthRes.json();
    assert(apiKeyAuthRes.status === 200, 'Client Mobile App Authenticates via x-api-key Header', `Name: ${apiKeyAuthData.name}`);

    // Test access by project code slug using x-api-key
    const slugRouteRes = await fetch(
      `${BASE_URL}/projects/${projectA.code}/members/${memberAlice._id}`,
      {
        headers: {
          'x-api-key': projectA.apiKey,
        },
      },
    );
    assert(slugRouteRes.status === 200, 'Route supports project slug code via x-api-key', `Status: ${slugRouteRes.status}`);

    // Cross-tenant access protection: Try accessing Project B using Project A's API key
    const crossKeyRes = await fetch(
      `${BASE_URL}/projects/${projectB._id}/members`,
      {
        headers: {
          'x-api-key': projectA.apiKey,
        },
      },
    );
    assert(
      crossKeyRes.status === 403,
      'Cross-Project Access Blocked when using unauthorized x-api-key (403 Forbidden)',
      `Status: ${crossKeyRes.status}`,
    );

    // Invalid API key protection
    const invalidKeyRes = await fetch(
      `${BASE_URL}/projects/${projectA._id}/members`,
      {
        headers: {
          'x-api-key': 'pk_invalid_key_12345',
        },
      },
    );
    assert(
      invalidKeyRes.status === 401,
      'Invalid API Key Rejected (401 Unauthorized)',
      `Status: ${invalidKeyRes.status}`,
    );

    // -------------------------------------------------------------
    // STEP 10: Mobile App End-User Login & /api/me Dedicated Flow
    // -------------------------------------------------------------
    console.log('\n--> STEP 10: Mobile App End-User Login & /api/me Endpoints');

    // 1. Mobile client logs in user with external user ID (no admin token or api key needed)
    const mobileUserExternalId = `mobile_dev_${timestamp}`;
    const memberLoginRes = await fetch(
      `${BASE_URL}/projects/${projectA._id}/members/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalUserId: mobileUserExternalId,
          name: 'Mobile App User',
          email: `mobile_${timestamp}@example.com`,
        }),
      },
    );
    const memberLoginData = await memberLoginRes.json();
    assert(
      memberLoginRes.status === 201,
      'Public Mobile Login (No Admin Token Required)',
      `ExternalId: ${memberLoginData.member?.externalUserId}`,
    );
    assert(
      !!memberLoginData.accessToken,
      'Member JWT Token Issued for Client',
    );
    const memberToken = memberLoginData.accessToken;

    // 2. Mobile client fetches /api/me/profile with Member JWT
    const meProfileRes = await fetch(`${BASE_URL}/me/profile`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const meProfile = await meProfileRes.json();
    assert(
      meProfileRes.status === 200,
      'GET /api/me/profile with Member JWT',
      `Name: ${meProfile.name}, Coins: ${meProfile.coinBalance}`,
    );
    assert(
      meProfile.coinBalance === 10,
      'Welcome Coins (10) Present in Member Profile',
    );
    const mobileUserReferralCode = meProfile.referralCode;

    // 3. Friend logs in via mobile using Member's referral code
    const friendLoginRes = await fetch(
      `${BASE_URL}/projects/${projectA._id}/members/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalUserId: `mobile_friend_${timestamp}`,
          name: 'Mobile Friend',
          email: `friend_${timestamp}@example.com`,
          referralCode: mobileUserReferralCode,
        }),
      },
    );
    const friendLoginData = await friendLoginRes.json();
    assert(
      friendLoginRes.status === 201,
      'Friend Onboarded via Mobile Login with Referral Code',
    );
    assert(
      friendLoginData.member?.coinBalance === 35,
      'Friend Received Welcome (10) + Referee Bonus (25) = 35',
      `Balance: ${friendLoginData.member?.coinBalance}`,
    );

    // 4. Mobile user checks /api/me/referrals
    const meReferralsRes = await fetch(`${BASE_URL}/me/referrals`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const meReferrals = await meReferralsRes.json();
    assert(
      meReferralsRes.status === 200,
      'GET /api/me/referrals with Member JWT',
    );
    assert(
      meReferrals.totalInvited === 1 && meReferrals.totalCoinsEarned === 50,
      'Referral Stats Accurately Updated (+50 Coins Earned)',
      `Total Invited: ${meReferrals.totalInvited}, Coins: ${meReferrals.totalCoinsEarned}`,
    );

    // 5. Mobile user redeems universal coupon via /api/me/coupons/redeem
    // Let's create a fresh coupon for mobile user
    const mobileCouponCode = `APP200_${timestamp.toString().slice(-4)}`;
    await fetch(`${BASE_URL}/coupons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        code: mobileCouponCode,
        rewardCoins: 200,
        maxGlobalUses: 100,
      }),
    });

    const meCouponRes = await fetch(`${BASE_URL}/me/coupons/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({ couponCode: mobileCouponCode }),
    });
    const meCouponData = await meCouponRes.json();
    assert(
      meCouponRes.status === 200,
      'POST /api/me/coupons/redeem with Member JWT (No memberId needed in body)',
      `Awarded: ${meCouponData.coinsAwarded}, New Balance: ${meCouponData.newBalance}`,
    );
    // User had 10 (welcome) + 50 (referral) + 200 (coupon) = 260 coins

    // 6. Mobile user views available gift cards catalog
    const meGiftCardsRes = await fetch(`${BASE_URL}/me/gift-cards`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const meGiftCards = await meGiftCardsRes.json();
    assert(
      meGiftCardsRes.status === 200 && Array.isArray(meGiftCards),
      'GET /api/me/gift-cards with Member JWT',
      `Catalog Count: ${meGiftCards.length}`,
    );

    // 7. Mobile user redeems gift card via /api/me/gift-cards/:id/redeem
    const meRedeemGcRes = await fetch(
      `${BASE_URL}/me/gift-cards/${giftCardA._id}/redeem`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
      },
    );
    const meRedemption = await meRedeemGcRes.json();
    assert(
      meRedeemGcRes.status === 201,
      'POST /api/me/gift-cards/:id/redeem using Member JWT',
      `Redemption ID: ${meRedemption._id}`,
    );

    // 8. Mobile user views redemption history
    const meRedemptionsListRes = await fetch(
      `${BASE_URL}/me/gift-cards/redemptions`,
      {
        headers: { Authorization: `Bearer ${memberToken}` },
      },
    );
    const meRedemptionsList = await meRedemptionsListRes.json();
    assert(
      meRedemptionsListRes.status === 200 && meRedemptionsList.length >= 1,
      'GET /api/me/gift-cards/redemptions returns member personal redemption records',
      `Count: ${meRedemptionsList.length}`,
    );

    // 9. Mobile user checks full transaction history
    const meTxRes = await fetch(`${BASE_URL}/me/transactions`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const meTxs = await meTxRes.json();
    assert(
      meTxRes.status === 200 && meTxs.length >= 3,
      'GET /api/me/transactions returns full coin ledger history for member',
      `Ledger Entries: ${meTxs.length}`,
    );

    // -------------------------------------------------------------
    // STEP 11: Gostatus / Feedico Partner Coupons Sync & Member Flow
    // -------------------------------------------------------------
    console.log('\n--- STEP 11: Gostatus / Feedico Partner Coupons Sync & Redemption ---');

    // 1. Admin triggers live sync of coupons into MongoDB
    const syncRes = await fetch(`${BASE_URL}/api/gostatus-coupons/sync`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const syncData = await syncRes.json();
    assert(
      syncRes.status === 200 || syncRes.status === 201,
      'POST /api/gostatus-coupons/sync successfully triggers Supabase coupon sync',
      `Result: ${syncData.message || JSON.stringify(syncData)}`,
    );

    // 2. Public / Catalog query to browse synced coupons from MongoDB
    const listCouponsRes = await fetch(
      `${BASE_URL}/api/gostatus-coupons?limit=10&page=1`,
    );
    const listCouponsData = await listCouponsRes.json();
    assert(
      listCouponsRes.status === 200 &&
        Array.isArray(listCouponsData.data) &&
        listCouponsData.data.length > 0,
      'GET /api/gostatus-coupons returns paginated coupons from local database',
      `Total: ${listCouponsData.total}, Returned: ${listCouponsData.data?.length}`,
    );

    const targetCoupon = listCouponsData.data[0];

    // 3. Get single coupon details by numeric externalId or ObjectId
    const getSingleRes = await fetch(
      `${BASE_URL}/api/gostatus-coupons/${targetCoupon.externalId}`,
    );
    const singleData = await getSingleRes.json();
    assert(
      getSingleRes.status === 200 && singleData.brand === targetCoupon.brand,
      'GET /api/gostatus-coupons/:id retrieves single coupon by externalId',
      `Brand: ${singleData.brand}`,
    );

    // 4. Mobile user browses partner coupons via /api/me/gostatus-coupons
    const meGostatusRes = await fetch(`${BASE_URL}/me/gostatus-coupons?limit=5`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const meGostatusData = await meGostatusRes.json();
    assert(
      meGostatusRes.status === 200 && meGostatusData.data.length > 0,
      'GET /api/me/gostatus-coupons allows member to browse partner coupons',
      `Count: ${meGostatusData.data?.length}`,
    );

    // 5. Member redeems partner coupon using their coins
    const redeemPartnerRes = await fetch(
      `${BASE_URL}/me/gostatus-coupons/${targetCoupon.externalId}/redeem`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${memberToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const redeemPartnerData = await redeemPartnerRes.json();
    assert(
      redeemPartnerRes.status === 200 && redeemPartnerData.code,
      'POST /api/me/gostatus-coupons/:id/redeem redeems coupon and returns promo code',
      `Code: ${redeemPartnerData.code}, New Balance: ${redeemPartnerData.balance}`,
    );

    // 6. Member views personal redeemed partner coupons list
    const myGostatusRes = await fetch(
      `${BASE_URL}/me/gostatus-coupons/my-coupons`,
      {
        headers: { Authorization: `Bearer ${memberToken}` },
      },
    );
    const myGostatusList = await myGostatusRes.json();
    assert(
      myGostatusRes.status === 200 &&
        Array.isArray(myGostatusList) &&
        myGostatusList.length >= 1,
      'GET /api/me/gostatus-coupons/my-coupons lists member redeemed partner coupons',
      `Redeemed count: ${myGostatusList.length}`,
    );

    // -------------------------------------------------------------
    // STEP 12: Claim Referral Code Later (/api/me/referral)
    // -------------------------------------------------------------
    console.log('\n--- STEP 12: Claim Referral Code Later (/api/me/referral) ---');

    // 1. Onboard Late Claimer in Project A without referral code
    const lateLoginRes = await fetch(
      `${BASE_URL}/projects/${projectA._id}/members/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': projectA.apiKey,
        },
        body: JSON.stringify({
          externalUserId: `late_user_${timestamp}`,
          name: 'Late Claimer User',
        }),
      },
    );
    const lateLoginData = await lateLoginRes.json();
    const lateToken = lateLoginData.accessToken;
    const lateMember = lateLoginData.member;
    assert(
      (lateLoginRes.status === 200 || lateLoginRes.status === 201) &&
        !lateMember.referredBy,
      'Member logged in without referral code (referredBy is null)',
      `Balance: ${lateMember.coinBalance}`,
    );

    // 2. Test: Invalid referral code (404)
    const invalidCodeRes = await fetch(`${BASE_URL}/me/referral`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lateToken}`,
      },
      body: JSON.stringify({ referralCode: 'NONEXISTENT123' }),
    });
    const invalidCodeData = await invalidCodeRes.json();
    assert(
      invalidCodeRes.status === 404 &&
        invalidCodeData.message === 'Invalid referral code',
      'POST /api/me/referral rejects non-existent code with 404',
      `Message: ${invalidCodeData.message}`,
    );

    // 3. Test: Own referral code (400 - must contain 'own')
    const ownCodeRes = await fetch(`${BASE_URL}/me/referral`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lateToken}`,
      },
      body: JSON.stringify({ referralCode: lateMember.referralCode }),
    });
    const ownCodeData = await ownCodeRes.json();
    assert(
      ownCodeRes.status === 400 &&
        ownCodeData.message.toLowerCase().includes('own'),
      'POST /api/me/referral rejects using own code with 400',
      `Message: ${ownCodeData.message}`,
    );

    // 4. Test: Window expired (403)
    const pExpiredRes = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Expired Project',
        code: `EXP_${timestamp.toString().slice(-4)}`,
        settings: {
          welcomeCoins: 10,
          referralRewardCoins: 50,
          refereeRewardCoins: 25,
          referralClaimWindowHours: 0,
        },
      }),
    });
    const pExpired = await pExpiredRes.json();

    // Onboard a referrer in pExpired so we have a valid referral code in that project
    const expReferrerRes = await fetch(
      `${BASE_URL}/projects/${pExpired._id}/members/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': pExpired.apiKey,
        },
        body: JSON.stringify({
          externalUserId: `exp_referrer_${timestamp}`,
          name: 'Expired Referrer User',
        }),
      },
    );
    const expReferrerData = await expReferrerRes.json();
    const expReferrerCode = expReferrerData.member.referralCode;

    const expiredUserRes = await fetch(
      `${BASE_URL}/projects/${pExpired._id}/members/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': pExpired.apiKey,
        },
        body: JSON.stringify({
          externalUserId: `expired_user_${timestamp}`,
          name: 'Expired Window User',
        }),
      },
    );
    const expiredUserData = await expiredUserRes.json();
    const expiredToken = expiredUserData.accessToken;

    // Small delay to ensure timestamp difference > 0
    await new Promise((r) => setTimeout(r, 50));

    const expiredClaimRes = await fetch(`${BASE_URL}/me/referral`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${expiredToken}`,
      },
      body: JSON.stringify({ referralCode: expReferrerCode }),
    });
    const expiredClaimData = await expiredClaimRes.json();
    assert(
      expiredClaimRes.status === 403 &&
        expiredClaimData.message === 'Referral window has expired',
      'POST /api/me/referral rejects expired claim window with 403',
      `Message: ${expiredClaimData.message}`,
    );

    // 5. Test: Successful referral claim (200)
    // Get Alice's balance before claim
    const aliceBeforeRes = await fetch(
      `${BASE_URL}/projects/${projectA._id}/members/${memberAlice._id}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );
    const aliceBefore = await aliceBeforeRes.json();

    const claimSuccessRes = await fetch(`${BASE_URL}/me/referral`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lateToken}`,
      },
      body: JSON.stringify({ referralCode: memberAlice.referralCode.toLowerCase() }), // tests lowercase trimming
    });
    const claimSuccessData = await claimSuccessRes.json();
    assert(
      claimSuccessRes.status === 200 &&
        claimSuccessData.member?.referredBy === memberAlice.referralCode &&
        claimSuccessData.refereeCoinsAwarded === 25 &&
        claimSuccessData.referrerCoinsAwarded === 50,
      'POST /api/me/referral successfully claims referral code',
      `Referee awarded: ${claimSuccessData.refereeCoinsAwarded}, Referrer awarded: ${claimSuccessData.referrerCoinsAwarded}`,
    );

    // Verify Late Claimer balance: 10 (welcome) + 25 (referee bonus) = 35
    assert(
      claimSuccessData.member.coinBalance === 35,
      'Late claimer coin balance updated to 35 (10 welcome + 25 referee bonus)',
      `Coin Balance: ${claimSuccessData.member.coinBalance}`,
    );

    // Verify Referrer (Alice) received 50 coins
    const aliceAfterRes = await fetch(
      `${BASE_URL}/projects/${projectA._id}/members/${memberAlice._id}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );
    const aliceAfter = await aliceAfterRes.json();
    assert(
      aliceAfter.coinBalance === aliceBefore.coinBalance + 50,
      'Referrer received referral reward (+50 coins)',
      `Before: ${aliceBefore.coinBalance}, After: ${aliceAfter.coinBalance}`,
    );

    // 6. Test: Already referred / duplicate claim (409 - must contain 'already')
    const duplicateClaimRes = await fetch(`${BASE_URL}/me/referral`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lateToken}`,
      },
      body: JSON.stringify({ referralCode: memberAlice.referralCode }),
    });
    const duplicateClaimData = await duplicateClaimRes.json();
    assert(
      duplicateClaimRes.status === 409 &&
        duplicateClaimData.message.toLowerCase().includes('already'),
      'POST /api/me/referral rejects second claim with 409 (contains "already")',
      `Message: ${duplicateClaimData.message}`,
    );

    // 7. Test: Two concurrent requests -> exactly one REFEREE_BONUS and one REFERRAL_CREDIT
    const concUserRes = await fetch(
      `${BASE_URL}/projects/${projectA._id}/members/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': projectA.apiKey,
        },
        body: JSON.stringify({
          externalUserId: `conc_user_${timestamp}`,
          name: 'Concurrent User',
        }),
      },
    );
    const concUserData = await concUserRes.json();
    const concToken = concUserData.accessToken;
    const concMemberId = concUserData.member._id;

    // Fire two requests concurrently
    const [concRes1, concRes2] = await Promise.all([
      fetch(`${BASE_URL}/me/referral`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${concToken}`,
        },
        body: JSON.stringify({ referralCode: memberAlice.referralCode }),
      }),
      fetch(`${BASE_URL}/me/referral`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${concToken}`,
        },
        body: JSON.stringify({ referralCode: memberAlice.referralCode }),
      }),
    ]);

    const statuses = [concRes1.status, concRes2.status].sort();
    assert(
      statuses[0] === 200 && statuses[1] === 409,
      'Two concurrent claim requests produce exactly one 200 OK and one 409 Conflict',
      `Statuses: ${concRes1.status}, ${concRes2.status}`,
    );

    // Verify transactions for concurrent user: exactly one REFEREE_BONUS
    const concTxsRes = await fetch(`${BASE_URL}/me/transactions`, {
      headers: { Authorization: `Bearer ${concToken}` },
    });
    const concTxs = await concTxsRes.json();
    const refereeBonusTxs = concTxs.filter(
      (tx: any) => tx.type === 'REFEREE_BONUS',
    );
    assert(
      refereeBonusTxs.length === 1,
      'Exactly ONE REFEREE_BONUS transaction created despite concurrent requests',
      `REFEREE_BONUS Count: ${refereeBonusTxs.length}`,
    );

    // Verify member final balance: exactly 35 (not double paid)
    const concProfileRes = await fetch(`${BASE_URL}/me/profile`, {
      headers: { Authorization: `Bearer ${concToken}` },
    });
    const concProfile = await concProfileRes.json();
    assert(
      concProfile.coinBalance === 35,
      'Concurrent member final coin balance is exactly 35 (no double credit)',
      `Balance: ${concProfile.coinBalance}`,
    );

    // Verify Referrer transactions for this referee: exactly ONE REFERRAL_CREDIT
    const aliceTxsRes = await fetch(
      `${BASE_URL}/projects/${projectA._id}/members/${memberAlice._id}/transactions`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );
    const aliceConcTxs = await aliceTxsRes.json();
    const concReferralCredits = aliceConcTxs.filter(
      (tx: any) =>
        tx.type === 'REFERRAL_CREDIT' &&
        tx.metadata?.refereeMemberId === concMemberId,
    );
    assert(
      concReferralCredits.length === 1,
      'Exactly ONE REFERRAL_CREDIT transaction created for referrer',
      `REFERRAL_CREDIT Count: ${concReferralCredits.length}`,
    );

  } catch (err: any) {
    console.error('Unhandled test exception:', err);
    failedCount++;
  } finally {
    console.log('\n=================================================================');
    console.log(`  VERIFICATION RESULTS: ${passedCount} PASSED | ${failedCount} FAILED`);
    console.log('=================================================================\n');

    await app.close();
    process.exit(failedCount === 0 ? 0 : 1);
  }
}

runTests();
