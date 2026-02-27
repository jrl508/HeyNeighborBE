exports.up = function (knex) {
  return knex.schema
    .createTable("user_blocks", (table) => {
      table.increments("id").primary();
      table.integer("blocker_id").unsigned().notNullable();
      table.integer("blocked_id").unsigned().notNullable();
      table.timestamps(true, true);

      table.unique(["blocker_id", "blocked_id"]); // A user can only block another user once
      table.foreign("blocker_id").references("users.id").onDelete("CASCADE");
      table.foreign("blocked_id").references("users.id").onDelete("CASCADE");
    })
    .table("conversation_participants", (table) => {
      table.timestamp("archived_at").nullable();
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("user_blocks")
    .table("conversation_participants", (table) => {
      table.dropColumn("archived_at");
    });
};
