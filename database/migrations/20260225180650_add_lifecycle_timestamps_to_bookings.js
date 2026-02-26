exports.up = function (knex) {
  return knex.schema.table("bookings", (table) => {
    table.timestamp("confirmed_at").nullable();
    table.timestamp("activated_at").nullable();
    table.timestamp("return_initiated_at").nullable();
    table.timestamp("completed_at").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("bookings", (table) => {
    table.dropColumn("confirmed_at");
    table.dropColumn("activated_at");
    table.dropColumn("return_initiated_at");
    table.dropColumn("completed_at");
  });
};
