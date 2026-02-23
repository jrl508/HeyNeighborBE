/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("local_businesses").del();

  // Get users from the database
  const users = await knex("users").select("id").orderBy("id");

  if (users.length === 0) {
    console.log("No users found. Skipping local_businesses seeds.");
    return;
  }

  // Sample local businesses
  const businesses = [
    {
      owner_id: users[0].id,
      name: "Joe's Contracting",
      type: "General Contractor",
      address: "123 Main St, Taunton, MA 02780",
      phone: "555-555-5555",
      description: "Experienced general contractor specializing in home renovations",
      hours: {
        startTime: { hour: "09", minute: "00", mer: "AM" },
        endTime: { hour: "05", minute: "00", mer: "PM" },
        days: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
      },
      links: [
        { url: "https://www.joescontracting.com", type: 1 },
        { url: "https://www.facebook.com/joescontracting", type: 2 },
      ],
      rating: 4.5,
      review_count: 10,
      lat: 41.9099,
      lng: -71.1999,
    },
    {
      owner_id: users[1]?.id || users[0].id,
      name: "Sarah's Plumbing Services",
      type: "Plumber",
      address: "456 Oak Ave, Taunton, MA 02780",
      phone: "555-666-6666",
      description: "Licensed plumber offering residential and commercial services",
      hours: {
        startTime: { hour: "08", minute: "00", mer: "AM" },
        endTime: { hour: "06", minute: "00", mer: "PM" },
        days: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false },
      },
      links: [
        { url: "https://www.sarahsplumbing.com", type: 1 },
      ],
      rating: 4.8,
      review_count: 15,
      lat: 41.9089,
      lng: -71.2009,
    },
    {
      owner_id: users[0].id,
      name: "Mike's Electrical",
      type: "Electrician",
      address: "789 Elm St, Taunton, MA 02780",
      phone: "555-777-7777",
      description: "Licensed electrician for residential and commercial electrical work",
      hours: {
        startTime: { hour: "07", minute: "00", mer: "AM" },
        endTime: { hour: "04", minute: "00", mer: "PM" },
        days: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
      },
      links: [
        { url: "https://www.mikeselectrical.com", type: 1 },
      ],
      rating: 4.6,
      review_count: 12,
      lat: 41.9079,
      lng: -71.1989,
    },
    {
      owner_id: users[1]?.id || users[0].id,
      name: "Jessica's Landscaping",
      type: "Landscaper",
      address: "321 Pine Rd, Taunton, MA 02780",
      phone: "555-888-8888",
      description: "Professional landscaping and lawn care services",
      hours: {
        startTime: { hour: "06", minute: "00", mer: "AM" },
        endTime: { hour: "06", minute: "00", mer: "PM" },
        days: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false },
      },
      links: [
        { url: "https://www.jessicaslandscaping.com", type: 1 },
        { url: "https://www.facebook.com/jessicaslandscaping", type: 2 },
      ],
      rating: 4.7,
      review_count: 18,
      lat: 41.9109,
      lng: -71.1979,
    },
    {
      owner_id: users[0].id,
      name: "Tom's HVAC Services",
      type: "HVAC Technician",
      address: "654 Maple Dr, Taunton, MA 02780",
      phone: "555-999-9999",
      description: "HVAC installation, repair, and maintenance services",
      hours: {
        startTime: { hour: "08", minute: "00", mer: "AM" },
        endTime: { hour: "05", minute: "00", mer: "PM" },
        days: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false },
      },
      links: [
        { url: "https://www.tomshvac.com", type: 1 },
      ],
      rating: 4.4,
      review_count: 8,
      lat: 41.9099,
      lng: -71.2019,
    },
  ];

  await knex("local_businesses").insert(businesses);
};
