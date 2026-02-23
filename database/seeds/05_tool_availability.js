/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("tool_availability").del();

  // Get tools from the database
  const tools = await knex("tools").select("id").orderBy("id");

  if (tools.length === 0) {
    console.log("No tools found. Skipping tool_availability seeds.");
    return;
  }

  const today = new Date();

  // Helper to format dates
  const formatDate = (date) => date.toISOString().split("T")[0];

  // Create availability blocks for various reasons
  const blockedRanges = [];

  if (tools.length > 0) {
    // First tool: maintenance in 2 weeks for 1 week
    const maintenanceStart = new Date(today);
    maintenanceStart.setDate(maintenanceStart.getDate() + 14);
    const maintenanceEnd = new Date(maintenanceStart);
    maintenanceEnd.setDate(maintenanceEnd.getDate() + 7);

    blockedRanges.push({
      tool_id: tools[0].id,
      blocked_start: formatDate(maintenanceStart),
      blocked_end: formatDate(maintenanceEnd),
      reason: "maintenance",
      notes: "Annual service and inspection",
    });

    // First tool: owner vacation
    const vacationStart = new Date(today);
    vacationStart.setDate(vacationStart.getDate() + 35);
    const vacationEnd = new Date(vacationStart);
    vacationEnd.setDate(vacationEnd.getDate() + 10);

    blockedRanges.push({
      tool_id: tools[0].id,
      blocked_start: formatDate(vacationStart),
      blocked_end: formatDate(vacationEnd),
      reason: "owner_unavailable",
      notes: "Owner on vacation, no rentals during this period",
    });
  }

  if (tools.length > 1) {
    // Second tool: scheduled maintenance next month
    const maintenanceStart = new Date(today);
    maintenanceStart.setDate(maintenanceStart.getDate() + 30);
    const maintenanceEnd = new Date(maintenanceStart);
    maintenanceEnd.setDate(maintenanceEnd.getDate() + 3);

    blockedRanges.push({
      tool_id: tools[1].id,
      blocked_start: formatDate(maintenanceStart),
      blocked_end: formatDate(maintenanceEnd),
      reason: "maintenance",
      notes: "Parts replacement and calibration",
    });
  }

  if (blockedRanges.length > 0) {
    await knex("tool_availability").insert(blockedRanges);
  }
};
