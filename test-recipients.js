// Test script to debug SMS recipients functionality
const fetch = require("node-fetch"); // You might need to install this

async function testRecipientsAPI() {
  const baseUrl = "http://localhost:3000";

  try {
    console.log("🧪 Testing SMS Recipients API...");

    // Test 1: Get recipients (should create empty file)
    console.log("\n1. Testing GET /api/sms-recipients...");
    const getResponse = await fetch(`${baseUrl}/api/sms-recipients`);
    const getData = await getResponse.json();
    console.log("GET Response:", JSON.stringify(getData, null, 2));

    // Test 2: Add a recipient
    console.log("\n2. Testing POST /api/sms-recipients...");
    const addResponse = await fetch(`${baseUrl}/api/sms-recipients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber: "+639171234567",
      }),
    });
    const addData = await addResponse.json();
    console.log("POST Response:", JSON.stringify(addData, null, 2));

    // Test 3: Get recipients again (should show the added number)
    console.log("\n3. Testing GET /api/sms-recipients again...");
    const getResponse2 = await fetch(`${baseUrl}/api/sms-recipients`);
    const getData2 = await getResponse2.json();
    console.log("GET Response:", JSON.stringify(getData2, null, 2));

    console.log("\n✅ API testing complete!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testRecipientsAPI();
