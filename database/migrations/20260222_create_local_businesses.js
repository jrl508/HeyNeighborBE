exports.up = function (knex) {
  return knex.schema.createTable("local_businesses", (table) => {
    table.increments("id").primary();
    table.integer("owner_id").unsigned().notNullable();
    table.string("name").notNullable();
    table.string("type").notNullable(); // e.g. "General Contractor", "Electrician", etc.
    table.string("address").notNullable();
    table.string("phone").nullable();
    table.json("hours").nullable(); // { startTime: { hour, minute, mer }, endTime: { hour, minute, mer }, days: { mon, tue, wed, thu, fri, sat, sun } }
    table.json("links").nullable(); // [ { url, type: 1 (web) | 2 (facebook) } ]
    table.decimal("rating", 3, 2).defaultTo(0); // 0-5 rating
    table.integer("review_count").defaultTo(0);
    table.text("description").nullable();
    table.decimal("lat", 10, 8).nullable();
    table.decimal("lng", 11, 8).nullable();
    table.timestamps(true, true); // created_at, updated_at
    table.foreign("owner_id").references("users.id").onDelete("CASCADE");
    table.index("owner_id");
    table.index("type");
    table.index(["lat", "lng"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("local_businesses");
};
