// Add owner auto-approval preference to tools table
exports.up = function (knex) {
  return knex.schema.table("tools", (table) => {
    table.boolean("auto_approve_bookings").defaultTo(false);
  });
};

exports.down = function (knex) {
  return knex.schema.table("tools", (table) => {
    table.dropColumn("auto_approve_bookings");
  });
};
