/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("tools").del();

  // Get all users from the database
  const users = await knex("users").select("id").orderBy("id");

  if (users.length === 0) {
    console.log("No users found. Please seed users first.");
    return;
  }

  // Create tools array with dynamically assigned user_ids
  const tools = [];

  // User 1 tools
  tools.push(
    {
      user_id: users[0].id,
      name: "Cordless Drill",
      description:
        "20V DeWalt cordless drill with battery and charger. Perfect for home repairs and DIY projects.",
      category: "Power Tools",
      rental_price_per_day: 15.0,
      available: true,
      image_url: null,
      deliveryAvailable: true,
    },
    {
      user_id: users[0].id,
      name: "Ladder",
      description:
        "6-foot aluminum extension ladder. Lightweight and sturdy for indoor and outdoor use.",
      category: "Tools",
      rental_price_per_day: 8.0,
      available: true,
      image_url: null,
      deliveryAvailable: false,
    },
  );

  // User 2 tools
  tools.push(
    {
      user_id: users[1].id,
      name: "Pressure Washer",
      description:
        "3000 PSI gas-powered pressure washer. Great for cleaning driveways, decks, and siding.",
      category: "Outdoor Equipment",
      rental_price_per_day: 35.0,
      available: true,
      image_url: null,
      deliveryAvailable: true,
    },
    {
      user_id: users[1].id,
      name: "Chainsaw",
      description:
        "16-inch gas chainsaw. Ideal for cutting firewood and light tree trimming.",
      category: "Outdoor Equipment",
      rental_price_per_day: 25.0,
      available: true,
      image_url: null,
      deliveryAvailable: true,
    },
  );

  // User 3 tools
  tools.push(
    {
      user_id: users[2].id,
      name: "Circular Saw",
      description:
        "7.5-inch circular saw with laser guide. Perfect for precise cutting in wood and composite materials.",
      category: "Power Tools",
      rental_price_per_day: 12.0,
      available: true,
      image_url: null,
      deliveryAvailable: false,
    },
    {
      user_id: users[2].id,
      name: "Miter Saw",
      description:
        "10-inch compound miter saw. Excellent for crosscutting and angled cuts.",
      category: "Power Tools",
      rental_price_per_day: 20.0,
      available: true,
      image_url: null,
      deliveryAvailable: true,
    },
  );

  // User 4 tools
  tools.push(
    {
      user_id: users[3].id,
      name: "Shop Vacuum",
      description:
        "20-gallon wet/dry vacuum with attachments. Perfect for workshops and garages.",
      category: "Tools",
      rental_price_per_day: 10.0,
      available: true,
      image_url: null,
      deliveryAvailable: false,
    },
    {
      user_id: users[3].id,
      name: "Air Compressor",
      description:
        "6-gallon air compressor with 150 PSI. Ideal for nail guns, paint sprayers, and other pneumatic tools.",
      category: "Tools",
      rental_price_per_day: 18.0,
      available: true,
      image_url: null,
      deliveryAvailable: true,
    },
  );

  // User 5 tools
  tools.push(
    {
      user_id: users[4].id,
      name: "Generator",
      description:
        "5500W portable generator. Great for backup power during outages or outdoor events.",
      category: "Power Equipment",
      rental_price_per_day: 40.0,
      available: true,
      image_url: null,
      deliveryAvailable: true,
    },
    {
      user_id: users[4].id,
      name: "Jack and Jack Stands",
      description:
        "Hydraulic floor jack with 3-ton capacity and matching jack stands. Safe and reliable.",
      category: "Automotive",
      rental_price_per_day: 15.0,
      available: true,
      image_url: null,
      deliveryAvailable: false,
    },
  );

  // User 6 tools
  tools.push(
    {
      user_id: users[5].id,
      name: "Reciprocating Saw",
      description:
        "Variable speed reciprocating saw. Great for cutting metal, plastic, and wood.",
      category: "Power Tools",
      rental_price_per_day: 14.0,
      available: true,
      image_url: null,
      deliveryAvailable: false,
    },
    {
      user_id: users[5].id,
      name: "Orbital Sander",
      description:
        "5-inch random orbital sander. Perfect for smoothing wood surfaces before finishing.",
      category: "Power Tools",
      rental_price_per_day: 11.0,
      available: true,
      image_url: null,
      deliveryAvailable: false,
    },
  );

  // User 7 tools
  tools.push(
    {
      user_id: users[6].id,
      name: "Tile Saw",
      description:
        "7-inch wet tile saw with stand. Ideal for cutting ceramic, porcelain, and stone tiles.",
      category: "Specialized Tools",
      rental_price_per_day: 30.0,
      available: true,
      image_url: null,
      deliveryAvailable: true,
    },
    {
      user_id: users[6].id,
      name: "Grout Float",
      description: "12-inch grout float for applying and smoothing tile grout.",
      category: "Tools",
      rental_price_per_day: 3.0,
      available: true,
      image_url: null,
      deliveryAvailable: false,
    },
  );

  // User 8 tools
  tools.push(
    {
      user_id: users[7].id,
      name: "Post Hole Digger",
      description:
        "Manual post hole digger. Perfect for fence installation and landscape projects.",
      category: "Outdoor Equipment",
      rental_price_per_day: 12.0,
      available: true,
      image_url: null,
      deliveryAvailable: false,
    },
    {
      user_id: users[7].id,
      name: "Garden Tiller",
      description:
        "Front-tine garden tiller for soil preparation. Great for small to medium gardens.",
      category: "Outdoor Equipment",
      rental_price_per_day: 28.0,
      available: true,
      image_url: null,
      deliveryAvailable: true,
    },
  );

  // User 9 tools
  tools.push(
    {
      user_id: users[8].id,
      name: "Power Drill Bit Set",
      description:
        "60-piece drill bit and driver set. Comprehensive selection for various materials.",
      category: "Power Tools",
      rental_price_per_day: 8.0,
      available: true,
      image_url: null,
      deliveryAvailable: false,
    },
    {
      user_id: users[8].id,
      name: "Stud Finder",
      description:
        "Electronic stud finder for locating wall framing. Perfect for hanging heavy items.",
      category: "Tools",
      rental_price_per_day: 6.0,
      available: true,
      image_url: null,
      deliveryAvailable: false,
    },
  );

  // User 10 tools
  tools.push(
    {
      user_id: users[9].id,
      name: "Carpet Cleaner Machine",
      description:
        "Portable carpet cleaning machine with upholstery attachment. Great for deep cleaning.",
      category: "Cleaning Equipment",
      rental_price_per_day: 32.0,
      available: true,
      image_url: null,
      deliveryAvailable: true,
    },
    {
      user_id: users[9].id,
      name: "Drywall Sander",
      description:
        "Electric drywall sander with dust collection system. Ideal for finishing drywall projects.",
      category: "Power Tools",
      rental_price_per_day: 22.0,
      available: true,
      image_url: null,
      deliveryAvailable: true,
    },
  );

  await knex("tools").insert(tools);
};
