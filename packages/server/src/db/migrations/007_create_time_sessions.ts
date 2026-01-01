import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('time_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('RESTRICT');
    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('RESTRICT');

    // Session details
    table.text('task_description').notNullable();

    // Time tracking
    table.timestamp('start_time', { useTz: true }).notNullable();
    table.timestamp('end_time', { useTz: true }).nullable();
    table.integer('duration_seconds').nullable(); // Computed when session ends

    // Session state
    table.enum('status', ['running', 'paused', 'stopped'])
      .notNullable()
      .defaultTo('running');

    // Billing
    table.integer('hourly_rate_cents').notNullable(); // Captured from project default at start
    table.bigInteger('billable_amount_cents').nullable(); // Computed: (duration_seconds / 3600) * hourly_rate_cents
    table.boolean('is_billable').notNullable().defaultTo(true);
    table.uuid('invoice_item_id').nullable().references('id').inTable('invoice_items').onDelete('SET NULL');
    table.timestamp('billed_at', { useTz: true }).nullable();

    // Metadata
    table.text('notes').nullable();

    // Timestamps
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Constraints
    table.check('end_time IS NULL OR end_time > start_time', [], 'time_sessions_end_after_start');
    table.check('duration_seconds IS NULL OR duration_seconds > 0', [], 'time_sessions_duration_positive');

    // Indexes
    table.index('project_id');
    table.index('client_id');
    table.index('status');
    table.index('start_time');

    // Index for unbilled sessions
    table.index('invoice_item_id');
  });

  // Critical: Create unique index to ensure only one active session at a time
  await knex.raw(`
    CREATE UNIQUE INDEX idx_time_sessions_single_active
    ON time_sessions(status)
    WHERE status = 'running'
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('time_sessions');
}
