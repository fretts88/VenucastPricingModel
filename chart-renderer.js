// Chart renderer class for pricing calculator
class ChartRenderer {
  constructor(pricingData) {
    this.pricingData = pricingData;
    this.quantityChartInstance = null;
    this.dayChartInstance = null;
  }

  static roundToOneDecimal(value) {
    return Math.round(value * 10) / 10;
  }

  static getMetricLabel(metric) {
    if (metric === "totalDiscount") return "Total Discount";
    if (metric === "discountPct") return "Percent Discount";
    return "Discounted Price";
  }

  static getMetricAxisTitle(metric) {
    return metric === "discountPct" ? "Percent" : "Total";
  }

  static formatMetricValue(metric, value) {
    const rounded = ChartRenderer.roundToOneDecimal(value);
    return metric === "discountPct" ? `${rounded}%` : `$${rounded}`;
  }

  plotQuantityChart() {
    const qtyMax = this.getPositiveInt("quantity", 1);
    const qtyStep = this.getPositiveInt("qtyChartStep", 1);
    const baseRate = this.getNumberInput("baseRate", 0);
    const metric = document.getElementById("qtyChartMetric").value;
    const fixedDays = this.getPositiveInt("days", 1);
    const sku = document.getElementById("sku").value.trim();

    const labels = [];
    const data = [];
    const engine = new PricingEngine(this.pricingData);

    for (let qty = 1; qty <= qtyMax; qty += qtyStep) {
      const result = engine.calculateRental(qty, fixedDays, sku, baseRate);
      labels.push(qty);
      data.push(ChartRenderer.roundToOneDecimal(result[metric]));
    }

    const ctx = document.getElementById("quantityChart").getContext("2d");
    if (this.quantityChartInstance) this.quantityChartInstance.destroy();
    this.quantityChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: `${ChartRenderer.getMetricLabel(metric)} (Days = ${fixedDays})`,
          data,
          borderColor: "#1f77b4",
          backgroundColor: "rgba(31, 119, 180, 0.15)",
          fill: true,
          tension: 0.15
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                return `${context.dataset.label}: ${ChartRenderer.formatMetricValue(metric, value)}`;
              }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: "Quantity" } },
          y: {
            title: { display: true, text: ChartRenderer.getMetricAxisTitle(metric) },
            ticks: {
              callback: (value) => ChartRenderer.formatMetricValue(metric, value)
            }
          }
        }
      }
    });
  }

  plotDayChart() {
    const dayMax = this.getPositiveInt("days", 1);
    const dayStep = this.getPositiveInt("dayChartStep", 1);
    const baseRate = this.getNumberInput("baseRate", 0);
    const metric = document.getElementById("dayChartMetric").value;
    const fixedQty = this.getPositiveInt("quantity", 1);
    const sku = document.getElementById("sku").value.trim();

    const labels = [];
    const data = [];
    const engine = new PricingEngine(this.pricingData);

    for (let days = 1; days <= dayMax; days += dayStep) {
      const result = engine.calculateRental(fixedQty, days, sku, baseRate);
      labels.push(days);
      data.push(ChartRenderer.roundToOneDecimal(result[metric]));
    }

    const ctx = document.getElementById("dayChart").getContext("2d");
    if (this.dayChartInstance) this.dayChartInstance.destroy();
    this.dayChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: `${ChartRenderer.getMetricLabel(metric)} (Qty = ${fixedQty})`,
          data,
          borderColor: "#ff7f0e",
          backgroundColor: "rgba(255, 127, 14, 0.15)",
          fill: true,
          tension: 0.15
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                return `${context.dataset.label}: ${ChartRenderer.formatMetricValue(metric, value)}`;
              }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: "Days" } },
          y: {
            title: { display: true, text: ChartRenderer.getMetricAxisTitle(metric) },
            ticks: {
              callback: (value) => ChartRenderer.formatMetricValue(metric, value)
            }
          }
        }
      }
    });
  }

  getNumberInput(id, fallback) {
    const value = parseFloat(document.getElementById(id).value);
    return Number.isFinite(value) ? value : fallback;
  }

  getPositiveInt(id, fallback) {
    const value = parseInt(document.getElementById(id).value, 10);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }
}
