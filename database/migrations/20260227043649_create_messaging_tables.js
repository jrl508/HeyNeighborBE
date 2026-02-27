exports.up = function (knex) {
  return knex.schema
    .createTable("conversations", (table) => {
      table.increments("id").primary();
      table.integer("booking_id").unsigned().nullable();
      table.timestamps(true, true); // created_at, updated_at

      table.foreign("booking_id").references("bookings.id").onDelete("SET NULL");
      table.index("booking_id");
    })
    .createTable("conversation_participants", (table) => {
      table.integer("conversation_id").unsigned().notNullable();
      table.integer("user_id").unsigned().notNullable();
      table.timestamps(true, true);

      table.primary(["conversation_id", "user_id"]);
      table.foreign("conversation_id").references("conversations.id").onDelete("CASCADE");
      table.foreign("user_id").references("users.id").onDelete("CASCADE");
      table.index("user_id");
    })
    .createTable("messages", (table) => {
      table.increments("id").primary();
      table.integer("conversation_id").unsigned().notNullable();
      table.integer("sender_id").unsigned().notNullable();
      table.text("content").notNullable();
      table.timestamp("read_at").nullable();
      table.timestamps(true, true);

      table.foreign("conversation_id").references("conversations.id").onDelete("CASCADE");
      table.foreign("sender_id").references("users.id").onDelete("CASCADE");
      table.index("conversation_id");
      table.index("sender_id");
      table.index("created_at");
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("messages")
    .dropTableIfExists("conversation_participants")
    .dropTableIfExists("conversations");
};
