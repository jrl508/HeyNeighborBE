/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('payments', table => {
    table.string('stripe_deposit_intent_id').nullable();
    table.enum('deposit_status', ['none', 'authorized', 'captured', 'released', 'claimed']).defaultTo('none');
    table.decimal('rental_amount', 10, 2).nullable();
    table.decimal('deposit_amount', 10, 2).nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('payments', table => {
    table.dropColumn('stripe_deposit_intent_id');
    table.dropColumn('deposit_status');
    table.dropColumn('rental_amount');
    table.dropColumn('deposit_amount');
  });
};
