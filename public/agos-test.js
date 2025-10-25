/**
 * AGOS System Integration Test
 * Comprehensive testing script for all professional features
 * Author: AGOS Development Team
 * Date: 2025-10-19
 */

class AGOSSystemTest {
  constructor() {
    this.config = {
      TEST_DURATION: 30000, // 30 seconds
      TEST_INTERVAL: 2000, // 2 seconds
      ENDPOINTS_TO_TEST: [
        "/api/health",
        "/api/sensor-data",
        "/api/historical-data",
        "/api/gps-locations",
        "/api/sms-recipients",
      ],
    };

    this.state = {
      testResults: {},
      websocketConnected: false,
      databaseConnected: false,
      arduinoResponding: false,
    };

    this.init();
  }

  async init() {
    console.log("🧪 Starting AGOS System Integration Test...");

    await this.testSystemHealth();
    await this.testDatabaseConnectivity();
    await this.testWebSocketConnection();
    await this.testAPIEndpoints();
    await this.testArduinoConsole();
    await this.testDataVisualization();
    await this.testGPSMapping();

    this.generateTestReport();
  }

  async testSystemHealth() {
    console.log("🔍 Testing system health...");

    try {
      const response = await fetch("/api/health");
      const data = await response.json();

      this.state.testResults.systemHealth = {
        status: "PASS",
        response: data,
        message: "System health check successful",
      };

      console.log("✅ System health: PASS");
    } catch (error) {
      this.state.testResults.systemHealth = {
        status: "FAIL",
        error: error.message,
        message: "System health check failed",
      };

      console.error("❌ System health: FAIL", error);
    }
  }

  async testDatabaseConnectivity() {
    console.log("🗄️ Testing database connectivity...");

    try {
      // Test historical data endpoint (database read)
      const response = await fetch("/api/historical-data?range=1h&limit=10");
      const data = await response.json();

      this.state.databaseConnected = data.success;
      this.state.testResults.database = {
        status: data.success ? "PASS" : "FAIL",
        response: data,
        message: `Database connectivity: ${
          data.success ? "Connected" : "Failed"
        }`,
      };

      console.log(
        `${data.success ? "✅" : "❌"} Database: ${
          data.success ? "PASS" : "FAIL"
        }`
      );
    } catch (error) {
      this.state.testResults.database = {
        status: "FAIL",
        error: error.message,
        message: "Database connectivity test failed",
      };

      console.error("❌ Database: FAIL", error);
    }
  }

  async testWebSocketConnection() {
    console.log("🔌 Testing WebSocket connection...");

    return new Promise((resolve) => {
      try {
        const wsUrl = `ws://${window.location.host}`;
        const testSocket = new WebSocket(wsUrl);

        const timeout = setTimeout(() => {
          this.state.testResults.websocket = {
            status: "FAIL",
            message: "WebSocket connection timeout",
          };
          console.error("❌ WebSocket: TIMEOUT");
          resolve();
        }, 5000);

        testSocket.onopen = () => {
          clearTimeout(timeout);
          this.state.websocketConnected = true;
          this.state.testResults.websocket = {
            status: "PASS",
            message: "WebSocket connection successful",
          };

          console.log("✅ WebSocket: PASS");
          testSocket.close();
          resolve();
        };

        testSocket.onerror = (error) => {
          clearTimeout(timeout);
          this.state.testResults.websocket = {
            status: "FAIL",
            error: error.message,
            message: "WebSocket connection failed",
          };

          console.error("❌ WebSocket: FAIL", error);
          resolve();
        };
      } catch (error) {
        this.state.testResults.websocket = {
          status: "FAIL",
          error: error.message,
          message: "WebSocket test failed",
        };

        console.error("❌ WebSocket: FAIL", error);
        resolve();
      }
    });
  }

  async testAPIEndpoints() {
    console.log("🌐 Testing API endpoints...");

    for (const endpoint of this.config.ENDPOINTS_TO_TEST) {
      try {
        console.log(`  Testing ${endpoint}...`);
        const response = await fetch(endpoint);
        const data = await response.json();

        this.state.testResults[
          `api_${endpoint.replace(/[^a-zA-Z0-9]/g, "_")}`
        ] = {
          status: response.ok ? "PASS" : "FAIL",
          statusCode: response.status,
          response: data,
          message: `${endpoint}: ${response.ok ? "SUCCESS" : "FAILED"}`,
        };

        console.log(
          `  ${response.ok ? "✅" : "❌"} ${endpoint}: ${response.status}`
        );
      } catch (error) {
        this.state.testResults[
          `api_${endpoint.replace(/[^a-zA-Z0-9]/g, "_")}`
        ] = {
          status: "FAIL",
          error: error.message,
          message: `${endpoint}: FAILED`,
        };

        console.error(`  ❌ ${endpoint}: FAILED`, error);
      }
    }
  }

  async testArduinoConsole() {
    console.log("🎮 Testing Arduino console integration...");

    try {
      // Test if Arduino console is accessible
      const response = await fetch("/arduino-console");
      const isAccessible = response.ok;

      this.state.testResults.arduinoConsole = {
        status: isAccessible ? "PASS" : "FAIL",
        statusCode: response.status,
        message: `Arduino console: ${
          isAccessible ? "Accessible" : "Not accessible"
        }`,
      };

      console.log(
        `${isAccessible ? "✅" : "❌"} Arduino Console: ${
          isAccessible ? "PASS" : "FAIL"
        }`
      );
    } catch (error) {
      this.state.testResults.arduinoConsole = {
        status: "FAIL",
        error: error.message,
        message: "Arduino console test failed",
      };

      console.error("❌ Arduino Console: FAIL", error);
    }
  }

  async testDataVisualization() {
    console.log("📊 Testing data visualization...");

    try {
      // Check if Chart.js is loaded
      const chartJsLoaded = typeof Chart !== "undefined";

      // Check if visualization module is available
      const visualizationLoaded = typeof AGOSDataVisualization !== "undefined";

      const allLoaded = chartJsLoaded && visualizationLoaded;

      this.state.testResults.dataVisualization = {
        status: allLoaded ? "PASS" : "FAIL",
        details: {
          chartJs: chartJsLoaded,
          visualizationModule: visualizationLoaded,
        },
        message: `Data visualization: ${allLoaded ? "Ready" : "Not ready"}`,
      };

      console.log(
        `${allLoaded ? "✅" : "❌"} Data Visualization: ${
          allLoaded ? "PASS" : "FAIL"
        }`
      );
    } catch (error) {
      this.state.testResults.dataVisualization = {
        status: "FAIL",
        error: error.message,
        message: "Data visualization test failed",
      };

      console.error("❌ Data Visualization: FAIL", error);
    }
  }

  async testGPSMapping() {
    console.log("🗺️ Testing GPS mapping system...");

    try {
      // Check if Leaflet is loaded
      const leafletLoaded = typeof L !== "undefined";

      // Test GPS locations API
      const gpsResponse = await fetch("/api/gps-locations");
      const gpsData = await gpsResponse.json();

      const mappingReady = leafletLoaded && gpsResponse.ok;

      this.state.testResults.gpsMapping = {
        status: mappingReady ? "PASS" : "FAIL",
        details: {
          leafletLoaded: leafletLoaded,
          gpsApiWorking: gpsResponse.ok,
          locationCount: gpsData.count || 0,
        },
        message: `GPS mapping: ${mappingReady ? "Ready" : "Not ready"}`,
      };

      console.log(
        `${mappingReady ? "✅" : "❌"} GPS Mapping: ${
          mappingReady ? "PASS" : "FAIL"
        }`
      );
    } catch (error) {
      this.state.testResults.gpsMapping = {
        status: "FAIL",
        error: error.message,
        message: "GPS mapping test failed",
      };

      console.error("❌ GPS Mapping: FAIL", error);
    }
  }

  generateTestReport() {
    console.log("\n🏁 AGOS System Integration Test Report");
    console.log("=====================================");

    let passCount = 0;
    let totalCount = 0;

    for (const [testName, result] of Object.entries(this.state.testResults)) {
      totalCount++;
      if (result.status === "PASS") {
        passCount++;
      }

      const status = result.status === "PASS" ? "✅ PASS" : "❌ FAIL";
      console.log(`${status} - ${testName}: ${result.message}`);

      if (result.error) {
        console.log(`       Error: ${result.error}`);
      }
    }

    const successRate = Math.round((passCount / totalCount) * 100);

    console.log("\n📊 Test Summary:");
    console.log(`   Tests Passed: ${passCount}/${totalCount}`);
    console.log(`   Success Rate: ${successRate}%`);
    console.log(
      `   System Status: ${
        successRate >= 80 ? "✅ HEALTHY" : "⚠️ NEEDS ATTENTION"
      }`
    );

    // Display recommendations
    this.generateRecommendations();

    // Create visual test report
    this.createVisualTestReport();
  }

  generateRecommendations() {
    console.log("\n💡 Recommendations:");

    if (!this.state.websocketConnected) {
      console.log("   • Check WebSocket server configuration");
    }

    if (!this.state.databaseConnected) {
      console.log("   • Verify database connection and SQLite setup");
    }

    if (this.state.testResults.dataVisualization?.status === "FAIL") {
      console.log("   • Ensure Chart.js library is properly loaded");
    }

    if (this.state.testResults.gpsMapping?.status === "FAIL") {
      console.log("   • Check Leaflet mapping library integration");
    }

    if (this.state.testResults.arduinoConsole?.status === "FAIL") {
      console.log("   • Verify Arduino console endpoint accessibility");
    }
  }

  createVisualTestReport() {
    // Create a visual test report in the UI
    const reportContainer = document.createElement("div");
    reportContainer.id = "agos-test-report";
    reportContainer.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: rgba(0, 0, 0, 0.9); color: white; padding: 20px; border-radius: 10px; max-width: 400px; z-index: 10000; font-family: monospace; font-size: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #3b82f6;">🧪 AGOS Test Report</h3>
                    <button onclick="this.parentElement.parentElement.remove()" style="background: #ef4444; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer;">×</button>
                </div>
                <div id="test-results-summary">
                    ${this.generateTestResultsHTML()}
                </div>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #333;">
                    <small>Click × to close this report</small>
                </div>
            </div>
        `;

    document.body.appendChild(reportContainer);

    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (reportContainer.parentElement) {
        reportContainer.remove();
      }
    }, 30000);
  }

  generateTestResultsHTML() {
    let html = "";

    for (const [testName, result] of Object.entries(this.state.testResults)) {
      const statusIcon = result.status === "PASS" ? "✅" : "❌";
      const statusColor = result.status === "PASS" ? "#22c55e" : "#ef4444";

      html += `
                <div style="margin-bottom: 8px; display: flex; align-items: center;">
                    <span style="margin-right: 8px;">${statusIcon}</span>
                    <span style="color: ${statusColor}; font-weight: bold; margin-right: 8px;">${
        result.status
      }</span>
                    <span>${testName.replace(/_/g, " ")}</span>
                </div>
            `;
    }

    return html;
  }

  // Public method to run specific test
  async runTest(testName) {
    console.log(`🧪 Running specific test: ${testName}`);

    switch (testName) {
      case "health":
        await this.testSystemHealth();
        break;
      case "database":
        await this.testDatabaseConnectivity();
        break;
      case "websocket":
        await this.testWebSocketConnection();
        break;
      case "api":
        await this.testAPIEndpoints();
        break;
      case "arduino":
        await this.testArduinoConsole();
        break;
      case "visualization":
        await this.testDataVisualization();
        break;
      case "mapping":
        await this.testGPSMapping();
        break;
      default:
        console.log(`❌ Unknown test: ${testName}`);
    }
  }
}

// Make available globally for manual testing
window.AGOSSystemTest = AGOSSystemTest;

// Auto-run test when page loads (with delay)
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    console.log("🚀 Starting automatic AGOS system test...");
    new AGOSSystemTest();
  }, 3000); // Wait 3 seconds for system to initialize
});
