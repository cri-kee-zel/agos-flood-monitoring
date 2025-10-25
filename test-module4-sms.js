/**
 * ====================================================================
 *  Module 4 SMS Flow Test Script
 * ====================================================================
 *
 * This script tests the SMS alert flow WITHOUT Arduino
 * to verify server endpoints and Module 4 communication
 *
 * Usage:
 * 1. Start your AGOS server: npm start
 * 2. Run this script: node test-module4-sms.js
 * 3. Check console output for test results
 */

const fetch = require("axios");

const SERVER_URL = "http://localhost:3000";
const TEST_PHONE = "+639123456789";

console.log("\n╔════════════════════════════════════════╗");
console.log("║   Module 4 SMS Flow Test Suite       ║");
console.log("╚════════════════════════════════════════╝\n");

// Helper function to print test results
function printResult(testName, passed, details = "") {
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} ${testName}`);
  if (details) console.log(`   ${details}\n`);
  else console.log("");
}

// Test 1: Check server health
async function testServerHealth() {
  console.log("🔍 Test 1: Server Health Check");
  try {
    const response = await fetch.get(`${SERVER_URL}/api/health`);
    const healthy =
      response.status === 200 && response.data.status === "healthy";
    printResult(
      "Server is running",
      healthy,
      `Version: ${response.data.version}`
    );
    return healthy;
  } catch (error) {
    printResult("Server is running", false, `Error: ${error.message}`);
    return false;
  }
}

// Test 2: Load recipients (should be empty initially)
async function testLoadRecipients() {
  console.log("🔍 Test 2: Load Recipients");
  try {
    const response = await fetch.get(`${SERVER_URL}/api/sms-recipients`);
    const success = response.status === 200 && response.data.success;
    printResult(
      "Load recipients endpoint works",
      success,
      `Current recipients: ${response.data.count}`
    );
    return { success, recipients: response.data.recipients };
  } catch (error) {
    printResult(
      "Load recipients endpoint works",
      false,
      `Error: ${error.message}`
    );
    return { success: false, recipients: [] };
  }
}

// Test 3: Add test phone number
async function testAddRecipient(phoneNumber) {
  console.log("🔍 Test 3: Add Recipient");
  try {
    const response = await fetch.post(`${SERVER_URL}/api/sms-recipients`, {
      phoneNumber: phoneNumber,
    });
    const success = response.status === 200 && response.data.success;
    printResult(
      "Add recipient endpoint works",
      success,
      `Added: ${phoneNumber}, Total: ${response.data.count}`
    );
    return success;
  } catch (error) {
    printResult(
      "Add recipient endpoint works",
      false,
      `Error: ${error.message}`
    );
    return false;
  }
}

// Test 4: Send SMS command
async function testSendSMS(alertType) {
  console.log(`🔍 Test 4: Send SMS Command (${alertType})`);
  try {
    const response = await fetch.post(`${SERVER_URL}/api/send-sms`, {
      alertType: alertType,
      operator: "Test Operator",
      timestamp: new Date().toISOString(),
      sensorData: {
        waterLevel: 25.5,
        flowRate: 0.6,
      },
    });
    const success = response.status === 200 && response.data.success;
    printResult(
      "Send SMS command endpoint works",
      success,
      `Command queued: ${response.data.command?.command}`
    );
    return success;
  } catch (error) {
    printResult(
      "Send SMS command endpoint works",
      false,
      `Error: ${error.message}`
    );
    return false;
  }
}

// Test 5: Arduino polls for command
async function testPollCommand() {
  console.log("🔍 Test 5: Arduino Poll Command");
  try {
    const response = await fetch.get(`${SERVER_URL}/api/sms-command`);
    const success = response.status === 200;
    const hasCommand = response.data.command !== null;

    if (hasCommand) {
      printResult(
        "Arduino can poll for commands",
        success,
        `Command received: ${response.data.command}\nRecipients: ${
          response.data.recipients?.length || 0
        }`
      );
    } else {
      printResult(
        "Arduino can poll for commands",
        success,
        "No pending commands (expected after first poll)"
      );
    }
    return { success, command: response.data };
  } catch (error) {
    printResult(
      "Arduino can poll for commands",
      false,
      `Error: ${error.message}`
    );
    return { success: false, command: null };
  }
}

// Test 6: Delete test recipient
async function testDeleteRecipient(phoneNumber) {
  console.log("🔍 Test 6: Delete Recipient (Cleanup)");
  try {
    const response = await fetch.delete(`${SERVER_URL}/api/sms-recipients`, {
      data: { phoneNumber: phoneNumber },
    });
    const success = response.status === 200 && response.data.success;
    printResult(
      "Delete recipient endpoint works",
      success,
      `Deleted: ${phoneNumber}, Remaining: ${response.data.count}`
    );
    return success;
  } catch (error) {
    printResult(
      "Delete recipient endpoint works",
      false,
      `Error: ${error.message}`
    );
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log("⏳ Starting test suite...\n");

  let allPassed = true;

  // Test 1: Server health
  const serverOk = await testServerHealth();
  if (!serverOk) {
    console.log(
      "❌ Server is not running. Please start server with: npm start"
    );
    return;
  }

  // Test 2: Load recipients
  const { success: loadOk, recipients } = await testLoadRecipients();
  allPassed = allPassed && loadOk;

  // Test 3: Add recipient
  const addOk = await testAddRecipient(TEST_PHONE);
  allPassed = allPassed && addOk;

  // Test 4: Send SMS command
  const sendOk = await testSendSMS("critical");
  allPassed = allPassed && sendOk;

  // Test 5: Poll command (should get the command)
  const { success: poll1Ok, command } = await testPollCommand();
  allPassed = allPassed && poll1Ok;

  // Test 5b: Poll again (should get null - command cleared)
  const { success: poll2Ok } = await testPollCommand();
  allPassed = allPassed && poll2Ok;

  // Test 6: Delete recipient (cleanup)
  const deleteOk = await testDeleteRecipient(TEST_PHONE);
  allPassed = allPassed && deleteOk;

  // Final summary
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║          Test Summary                 ║");
  console.log("╚════════════════════════════════════════╝\n");

  if (allPassed) {
    console.log(
      "🎉 All tests passed! Module 4 SMS flow is working correctly.\n"
    );
    console.log("✅ Ready to integrate Arduino R4 WiFi + SIM800L GSM\n");
    console.log("Next steps:");
    console.log("1. Upload Arduino sketch (agos_sms_integration.ino)");
    console.log("2. Update WiFi credentials in Arduino");
    console.log("3. Connect SIM800L to Arduino (TX=Pin3, RX=Pin2)");
    console.log("4. Test with Module 4 dashboard\n");
  } else {
    console.log("⚠️ Some tests failed. Please check the errors above.\n");
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error("💥 Test suite crashed:", error);
  process.exit(1);
});
