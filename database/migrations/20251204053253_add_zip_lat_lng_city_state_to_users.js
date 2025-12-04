/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table("users", (table) => {
    table.string("zip_code").nullable();
    table.decimal("lat", 9, 6).nullable();
    table.decimal("lng", 9, 6).nullable();
    table.string("city").nullable();
    table.string("state").nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table("users", (table) => {
    table.dropColumn("zip_code");
    table.dropColumn("lat");
    table.dropColumn("lng");
    table.dropColumn("city");
    table.dropColumn("state");
  });
};
