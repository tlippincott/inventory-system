import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('clients', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.string('name', 255).notNullable();
    table.string('email', 255).nullable();
    table.string('phone', 50).nullable();
    table.string('company_name', 255).nullable();

    // Billing address
    table.string('billing_address_line1', 255).nullable();
    table.string('billing_address_line2', 255).nullable();
    table.string('billing_city', 100).nullable();
    table.string('billing_state', 100).nullable();
    table.string('billing_postal_code', 20).nullable();
    table.string('billing_country', 100).nullable();

    // Payment terms
    table.integer('default_payment_terms').notNullable().defaultTo(30); // days
    table.string('default_currency', 3).notNullable().defaultTo('USD');

    // Tax info
    table.string('tax_id', 100).nullable();

    // Additional fields
    table.text('notes').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    // Timestamps
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('is_active');
    table.index('email');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('clients');
}
