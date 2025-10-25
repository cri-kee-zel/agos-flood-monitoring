/**
 * AGOS Module 3: Simple Historical Data Visualization
 * Displays water level and flow rate data from database
 * Author: AGOS Development Team
 * Date: 2025-10-19
 */

class AGOSHistoricalData {
  constructor() {
    this.config = {
      API_BASE: window.location.origin,
      UPDATE_INTERVAL: 30000, // 30 seconds
      CHART_COLORS: {
        waterLevel: "#3b82f6", // Blue
        flowRate: "#06b6d4", // Cyan
        background: "rgba(59, 130, 246, 0.1)",
        backgroundFlow: "rgba(6, 182, 212, 0.1)",
      },
      TIME_RANGES: {
        "1h": { hours: 1, label: "1 Hour" },
        "6h": { hours: 6, label: "6 Hours" },
        "24h": { hours: 24, label: "24 Hours" },
        "7d": { hours: 168, label: "7 Days" },
        "30d": { hours: 720, label: "30 Days" },
      },
    };

    this.state = {
      currentRange: "24h",
      data: [],
      charts: {},
      isLoading: false,
    };

    this.init();
  }

  async init() {
    console.log("📈 AGOS Historical Data System Initializing...");

    try {
      this.setupEventListeners();
      this.initializeCharts();
      await this.loadHistoricalData();
      this.startAutoRefresh();

      console.log("✅ Historical Data System Ready");
      this.updateStatus("System Ready");
    } catch (error) {
      console.error("❌ Historical Data System Error:", error);
      this.updateStatus("System Error");
    }
  }

  setupEventListeners() {
    // Time range buttons
    document.querySelectorAll(".time-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const range = e.target.dataset.range;
        this.changeTimeRange(range);
      });
    });

    // Chart control buttons
    document.getElementById("show-both")?.addEventListener("click", () => {
      this.updateCombinedChart("both");
    });
    document.getElementById("show-water")?.addEventListener("click", () => {
      this.updateCombinedChart("water");
    });
    document.getElementById("show-flow")?.addEventListener("click", () => {
      this.updateCombinedChart("flow");
    });

    // Export buttons
    document.getElementById("export-csv")?.addEventListener("click", () => {
      this.exportData("csv");
    });
    document.getElementById("export-json")?.addEventListener("click", () => {
      this.exportData("json");
    });
    document.getElementById("refresh-data")?.addEventListener("click", () => {
      this.loadHistoricalData();
    });
  }

  initializeCharts() {
    console.log("📊 Initializing charts...");

    // Water Level Chart
    const waterCtx = document.getElementById("water-level-chart");
    if (waterCtx) {
      this.state.charts.waterLevel = new Chart(waterCtx, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: "Water Level (inches)",
              data: [],
              borderColor: this.config.CHART_COLORS.waterLevel,
              backgroundColor: this.config.CHART_COLORS.background,
              borderWidth: 2,
              fill: true,
              tension: 0.3,
            },
          ],
        },
        options: this.getChartOptions("Water Level (inches)"),
      });
    }

    // Flow Rate Chart
    const flowCtx = document.getElementById("flow-rate-chart");
    if (flowCtx) {
      this.state.charts.flowRate = new Chart(flowCtx, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: "Flow Rate (m/s)",
              data: [],
              borderColor: this.config.CHART_COLORS.flowRate,
              backgroundColor: this.config.CHART_COLORS.backgroundFlow,
              borderWidth: 2,
              fill: true,
              tension: 0.3,
            },
          ],
        },
        options: this.getChartOptions("Flow Rate (m/s)"),
      });
    }

    // Combined Chart
    const combinedCtx = document.getElementById("combined-chart");
    if (combinedCtx) {
      this.state.charts.combined = new Chart(combinedCtx, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: "Water Level (inches)",
              data: [],
              borderColor: this.config.CHART_COLORS.waterLevel,
              backgroundColor: this.config.CHART_COLORS.background,
              borderWidth: 2,
              fill: true,
              tension: 0.3,
              yAxisID: "y",
            },
            {
              label: "Flow Rate (m/s)",
              data: [],
              borderColor: this.config.CHART_COLORS.flowRate,
              backgroundColor: this.config.CHART_COLORS.backgroundFlow,
              borderWidth: 2,
              fill: false,
              tension: 0.3,
              yAxisID: "y1",
            },
          ],
        },
        options: this.getCombinedChartOptions(),
      });
    }
  }

  getChartOptions(yAxisLabel) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: "Time",
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: yAxisLabel,
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
    };
  }

  getCombinedChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: "Time",
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        y: {
          type: "linear",
          display: true,
          position: "left",
          title: {
            display: true,
            text: "Water Level (inches)",
          },
          grid: {
            color: "rgba(59, 130, 246, 0.2)",
          },
        },
        y1: {
          type: "linear",
          display: true,
          position: "right",
          title: {
            display: true,
            text: "Flow Rate (m/s)",
          },
          grid: {
            drawOnChartArea: false,
            color: "rgba(6, 182, 212, 0.2)",
          },
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
    };
  }

  async loadHistoricalData() {
    console.log(`📊 Loading historical data for ${this.state.currentRange}...`);
    this.showLoading("Loading database data...");

    try {
      const range = this.config.TIME_RANGES[this.state.currentRange];
      const response = await fetch(
        `${this.config.API_BASE}/api/historical-data?range=${this.state.currentRange}&limit=1000`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        this.state.data = result.data;
        this.updateCharts();
        this.updateStatistics();
        this.updateDataInfo(result.count);

        console.log(`✅ Loaded ${result.count} data points`);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Failed to load historical data:", error);
      this.updateStatus("Data Load Error");
    } finally {
      this.hideLoading();
    }
  }

  updateCharts() {
    if (!this.state.data || this.state.data.length === 0) {
      console.warn("⚠️ No data to display");
      return;
    }

    // Prepare data for charts
    const labels = this.state.data.map((item) => {
      const date = new Date(item.timestamp);
      return date.toLocaleTimeString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    });

    const waterLevels = this.state.data.map((item) => item.water_level || 0);
    const flowRates = this.state.data.map((item) => item.flow_rate || 0);

    // Update Water Level Chart
    if (this.state.charts.waterLevel) {
      this.state.charts.waterLevel.data.labels = labels;
      this.state.charts.waterLevel.data.datasets[0].data = waterLevels;
      this.state.charts.waterLevel.update();
    }

    // Update Flow Rate Chart
    if (this.state.charts.flowRate) {
      this.state.charts.flowRate.data.labels = labels;
      this.state.charts.flowRate.data.datasets[0].data = flowRates;
      this.state.charts.flowRate.update();
    }

    // Update Combined Chart
    if (this.state.charts.combined) {
      this.state.charts.combined.data.labels = labels;
      this.state.charts.combined.data.datasets[0].data = waterLevels;
      this.state.charts.combined.data.datasets[1].data = flowRates;
      this.state.charts.combined.update();
    }

    console.log("📈 Charts updated successfully");
  }

  updateStatistics() {
    if (!this.state.data || this.state.data.length === 0) return;

    const waterLevels = this.state.data
      .map((item) => item.water_level || 0)
      .filter((val) => val > 0);
    const flowRates = this.state.data
      .map((item) => item.flow_rate || 0)
      .filter((val) => val >= 0);

    // Water Level Stats
    if (waterLevels.length > 0) {
      const maxWater = Math.max(...waterLevels);
      const minWater = Math.min(...waterLevels);
      const currentWater = waterLevels[waterLevels.length - 1] || 0;

      this.safeSetText("current-water-level", currentWater.toFixed(1));
      this.safeSetText("max-water-level", `${maxWater.toFixed(1)} inches`);
      this.safeSetText("min-water-level", `${minWater.toFixed(1)} inches`);
    }

    // Flow Rate Stats
    if (flowRates.length > 0) {
      const maxFlow = Math.max(...flowRates);
      const avgFlow = flowRates.reduce((a, b) => a + b, 0) / flowRates.length;
      const currentFlow = flowRates[flowRates.length - 1] || 0;

      this.safeSetText("current-flow-rate", currentFlow.toFixed(2));
      this.safeSetText("max-flow-rate", `${maxFlow.toFixed(2)} m/s`);
      this.safeSetText("avg-flow-rate", `${avgFlow.toFixed(2)} m/s`);
    }

    // System Stats
    this.safeSetText("total-records", this.state.data.length.toString());

    const latestData = this.state.data[this.state.data.length - 1];
    if (latestData) {
      this.safeSetText(
        "battery-level",
        (latestData.battery_level || 85).toString()
      );
      this.safeSetText("system-status", latestData.alert_status || "NORMAL");
    }
  }

  updateDataInfo(count) {
    this.safeSetText("data-count", count.toString());
    // Convert to Philippine Time (UTC+8)
    const now = new Date();
    const phtTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    this.safeSetText("last-update", phtTime.toLocaleTimeString("en-PH"));
  }

  changeTimeRange(range) {
    console.log(`📅 Changing time range to: ${range}`);

    // Update active button
    document.querySelectorAll(".time-btn").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.range === range) {
        btn.classList.add("active");
      }
    });

    this.state.currentRange = range;
    this.loadHistoricalData();
  }

  updateCombinedChart(mode) {
    console.log(`📊 Updating combined chart mode: ${mode}`);

    // Update active button
    document.querySelectorAll(".control-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    const chart = this.state.charts.combined;
    if (!chart) return;

    switch (mode) {
      case "water":
        chart.data.datasets[0].hidden = false;
        chart.data.datasets[1].hidden = true;
        document.getElementById("show-water").classList.add("active");
        break;
      case "flow":
        chart.data.datasets[0].hidden = true;
        chart.data.datasets[1].hidden = false;
        document.getElementById("show-flow").classList.add("active");
        break;
      case "both":
      default:
        chart.data.datasets[0].hidden = false;
        chart.data.datasets[1].hidden = false;
        document.getElementById("show-both").classList.add("active");
        break;
    }

    chart.update();
  }

  exportData(format) {
    console.log(`📤 Exporting data as ${format}`);

    if (!this.state.data || this.state.data.length === 0) {
      alert("No data to export");
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `agos-historical-data-${this.state.currentRange}-${timestamp}`;

    if (format === "csv") {
      this.exportCSV(filename);
    } else if (format === "json") {
      this.exportJSON(filename);
    }
  }

  exportCSV(filename) {
    const headers = [
      "timestamp",
      "water_level",
      "flow_rate",
      "upstream_turbidity",
      "downstream_turbidity",
      "battery_level",
      "alert_status",
    ];

    const csvContent = [
      headers.join(","),
      ...this.state.data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value || "";
          })
          .join(",")
      ),
    ].join("\n");

    this.downloadFile(csvContent, `${filename}.csv`, "text/csv");
  }

  exportJSON(filename) {
    const jsonData = {
      metadata: {
        exported: new Date().toISOString(),
        range: this.state.currentRange,
        count: this.state.data.length,
      },
      data: this.state.data,
    };

    const jsonContent = JSON.stringify(jsonData, null, 2);
    this.downloadFile(jsonContent, `${filename}.json`, "application/json");
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  startAutoRefresh() {
    setInterval(() => {
      console.log("🔄 Auto-refreshing data...");
      this.loadHistoricalData();
    }, this.config.UPDATE_INTERVAL);
  }

  updateStatus(message) {
    console.log(`ℹ️ Status: ${message}`);
    // Update status indicators if needed
  }

  showLoading(message = "Loading...") {
    const overlay = document.getElementById("loading-overlay");
    const text = document.getElementById("loading-text");

    if (overlay) overlay.classList.remove("hidden");
    if (text) text.textContent = message;

    this.state.isLoading = true;
  }

  hideLoading() {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) overlay.classList.add("hidden");

    this.state.isLoading = false;
  }

  safeSetText(id, text) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text;
    }
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("🌊 Initializing AGOS Historical Data System...");
  window.agosHistoricalData = new AGOSHistoricalData();
});
