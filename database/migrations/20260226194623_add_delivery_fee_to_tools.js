exports.up = function (knex) {
  return knex.schema.table("tools", (table) => {
    table.decimal("delivery_fee", 10, 2).defaultTo(0);
  });
};

exports.down = function (knex) {
  return knex.schema.table("tools", (table) => {
    table.dropColumn("delivery_fee");
  });
};
