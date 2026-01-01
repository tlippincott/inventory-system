import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_settings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.string('business_name', 255).notNullable();
    table.string('owner_name', 255).nullable();
    table.string('email', 255).nullable();
    table.string('phone', 50).nullable();

    // Business address
    table.string('address_line1', 255).nullable();
    table.string('address_line2', 255).nullable();
    table.string('city', 100).nullable();
    table.string('state', 100).nullable();
    table.string('postal_code', 20).nullable();
    table.string('country', 100).nullable();

    // Tax/Legal
    table.string('tax_id', 100).nullable();

    // Invoice defaults
    table.integer('default_payment_terms').notNullable().defaultTo(30);
    table.string('default_currency', 3).notNullable().defaultTo('USD');
    table.decimal('default_tax_rate', 5, 2).notNullable().defaultTo(0);

    // Invoice number config
    table.string('invoice_prefix', 20).notNullable().defaultTo('INV-');
    table.integer('next_invoice_number').notNullable().defaultTo(1);

    // Logo
    table.string('logo_path', 500).nullable();

    // Timestamps
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_settings');
}
