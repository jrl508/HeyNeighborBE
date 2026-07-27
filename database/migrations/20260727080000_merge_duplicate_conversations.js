exports.up = async function (knex) {
  const duplicatePairs = await knex.raw(`
    SELECT 
      LEAST(cp1.user_id, cp2.user_id) as user_a,
      GREATEST(cp1.user_id, cp2.user_id) as user_b,
      ARRAY_AGG(DISTINCT cp1.conversation_id ORDER BY cp1.conversation_id ASC) as conv_ids
    FROM conversation_participants cp1
    JOIN conversation_participants cp2 
      ON cp1.conversation_id = cp2.conversation_id 
     AND cp1.user_id < cp2.user_id
    GROUP BY LEAST(cp1.user_id, cp2.user_id), GREATEST(cp1.user_id, cp2.user_id)
    HAVING COUNT(DISTINCT cp1.conversation_id) > 1
  `);

  const rows = duplicatePairs.rows || duplicatePairs;

  for (const row of rows) {
    const convIds = row.conv_ids;
    if (!convIds || convIds.length <= 1) continue;

    const primaryConvId = convIds[0];
    const duplicateConvIds = convIds.slice(1);

    // Update messages to point to primary conversation
    await knex("messages")
      .whereIn("conversation_id", duplicateConvIds)
      .update({ conversation_id: primaryConvId });

    // Transfer booking_id if primary conversation doesn't have one
    const duplicateConvs = await knex("conversations")
      .whereIn("id", duplicateConvIds)
      .whereNotNull("booking_id");

    if (duplicateConvs.length > 0) {
      const primaryConv = await knex("conversations")
        .where("id", primaryConvId)
        .first();

      if (primaryConv && !primaryConv.booking_id) {
        await knex("conversations")
          .where("id", primaryConvId)
          .update({ booking_id: duplicateConvs[0].booking_id });
      }
    }

    // Delete duplicate participants
    await knex("conversation_participants")
      .whereIn("conversation_id", duplicateConvIds)
      .del();

    // Delete duplicate conversations
    await knex("conversations")
      .whereIn("id", duplicateConvIds)
      .del();
  }
};

exports.down = async function (knex) {
  // Non-reversible merge operation
};
