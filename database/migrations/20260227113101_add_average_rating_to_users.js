exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    table.decimal('average_rating', 2, 1).defaultTo(0.0);
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('average_rating');
  });
};