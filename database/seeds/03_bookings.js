/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("bookings").del();

  // Get users and tools from the database
  const users = await knex("users").select("id").orderBy("id");
  const tools = await knex("tools").select("id", "user_id", "rental_price_per_day").orderBy("id");

  if (users.length < 2 || tools.length < 2) {
    console.log("Not enough users or tools for booking seeds. Skipping.");
    return;
  }

  // Create various booking scenarios
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const twoWeeksAway = new Date(today);
  twoWeeksAway.setDate(twoWeeksAway.getDate() + 14);
  const nextMonth = new Date(today);
  nextMonth.setDate(nextMonth.getDate() + 30);

  const formatDate = (date) => date.toISOString().split("T")[0];

  // Helper to calculate total amount
  const calculateTotal = (startDate, endDate, pricePerDay, delivery = false) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const deliveryFee = delivery ? 25 : 0;
    const depositAmount = Math.ceil(pricePerDay * 0.2);
    return days * pricePerDay + deliveryFee + depositAmount;
  };

  const bookings = [
    // Requested booking (awaiting owner confirmation)
    {
      tool_id: tools[0].id,
      renter_id: users[1].id,
      owner_id: tools[0].user_id,
      start_date: formatDate(nextWeek),
      end_date: formatDate(new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000)),
      status: "requested",
      price_per_day: tools[0].rental_price_per_day,
      total_amount: calculateTotal(
        formatDate(nextWeek),
        formatDate(new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000)),
        tools[0].rental_price_per_day,
        true
      ),
      delivery_required: true,
      delivery_fee: 25,
      deposit_amount: Math.ceil(tools[0].rental_price_per_day * 0.2),
    },
    // Confirmed booking (owner approved, awaiting payment)
    {
      tool_id: tools[1].id,
      renter_id: users[0].id,
      owner_id: tools[1].user_id,
      start_date: formatDate(twoWeeksAway),
      end_date: formatDate(new Date(twoWeeksAway.getTime() + 2 * 24 * 60 * 60 * 1000)),
      status: "confirmed",
      price_per_day: tools[1].rental_price_per_day,
      total_amount: calculateTotal(
        formatDate(twoWeeksAway),
        formatDate(new Date(twoWeeksAway.getTime() + 2 * 24 * 60 * 60 * 1000)),
        tools[1].rental_price_per_day,
        false
      ),
      delivery_required: false,
      delivery_fee: 0,
      deposit_amount: Math.ceil(tools[1].rental_price_per_day * 0.2),
    },
    // Active booking (rental in progress)
    {
      tool_id: tools[0].id,
      renter_id: users[0].id,
      owner_id: tools[0].user_id,
      start_date: formatDate(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
      end_date: formatDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)), // 2 days from now
      status: "active",
      price_per_day: tools[0].rental_price_per_day,
      total_amount: calculateTotal(
        formatDate(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)),
        formatDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)),
        tools[0].rental_price_per_day,
        false
      ),
      delivery_required: false,
      delivery_fee: 0,
      deposit_amount: Math.ceil(tools[0].rental_price_per_day * 0.2),
    },
    // Completed booking
    {
      tool_id: tools[1].id,
      renter_id: users[1].id,
      owner_id: tools[1].user_id,
      start_date: formatDate(new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000)), // 10 days ago
      end_date: formatDate(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
      status: "completed",
      price_per_day: tools[1].rental_price_per_day,
      total_amount: calculateTotal(
        formatDate(new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000)),
        formatDate(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)),
        tools[1].rental_price_per_day,
        false
      ),
      delivery_required: false,
      delivery_fee: 0,
      deposit_amount: Math.ceil(tools[1].rental_price_per_day * 0.2),
    },
    // Cancelled booking
    {
      tool_id: tools[0].id,
      renter_id: users[1].id,
      owner_id: tools[0].user_id,
      start_date: formatDate(new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000)), // 20 days ago
      end_date: formatDate(new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000)), // 15 days ago
      status: "cancelled",
      price_per_day: tools[0].rental_price_per_day,
      total_amount: calculateTotal(
        formatDate(new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000)),
        formatDate(new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000)),
        tools[0].rental_price_per_day,
        false
      ),
      delivery_required: false,
      delivery_fee: 0,
      deposit_amount: Math.ceil(tools[0].rental_price_per_day * 0.2),
      cancelled_by: "renter",
      cancellation_reason: "Project finished earlier than expected",
    },
  ];

  await knex("bookings").insert(bookings);
};
