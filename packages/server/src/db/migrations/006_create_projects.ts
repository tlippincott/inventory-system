import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('projects', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');

    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.integer('default_hourly_rate_cents').notNullable().defaultTo(0);
    table.string('color', 7).nullable(); // Hex color, e.g., #FF5733

    table.boolean('is_active').notNullable().defaultTo(true);
    table.boolean('is_archived').notNullable().defaultTo(false);

    // Timestamps
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Constraints
    table.unique(['client_id', 'name']); // Prevent duplicate project names per client

    // Indexes
    table.index('client_id');
    table.index('is_active');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('projects');
}
