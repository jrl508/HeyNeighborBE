exports.up = function (knex) {
  return knex.schema.table("bookings", (table) => {
    table
      .enum("delivery_status", ["none", "requested", "confirmed", "rejected"])
      .defaultTo("none");
  });
};

exports.down = function (knex) {
  return knex.schema.table("bookings", (table) => {
    table.dropColumn("delivery_status");
  });
};
