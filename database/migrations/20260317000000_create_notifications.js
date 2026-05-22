
exports.up = function(knex) {
  return knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.integer('actor_id').unsigned()
      .references('id').inTable('users').onDelete('SET NULL');
    table.string('type').notNullable(); // e.g., 'booking_request', 'booking_confirmed', 'new_message'
    table.string('entity_type'); // e.g., 'booking', 'message', 'tool'
    table.integer('entity_id');
    table.text('content'); // Optional: snippet or specific message
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('notifications');
};
