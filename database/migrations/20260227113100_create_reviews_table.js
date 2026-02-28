exports.up = function(knex) {
  return knex.schema.createTable('reviews', function(table) {
    table.increments('id').primary();
    table.integer('booking_id').unsigned().notNullable();
    table.foreign('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.integer('reviewer_id').unsigned().notNullable();
    table.foreign('reviewer_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('reviewed_id').unsigned().notNullable();
    table.foreign('reviewed_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('rating_overall').notNullable();
    table.integer('rating_condition').notNullable();
    table.integer('rating_communication').notNullable();
    table.integer('rating_punctuality').notNullable();
    table.text('comment').nullable();
    table.timestamps(true, true);

    table.unique(['booking_id', 'reviewer_id', 'reviewed_id']);
    table.index('reviewed_id');
    table.index('booking_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('reviews');
};