import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('invoice_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('invoice_id').notNullable().references('id').inTable('invoices').onDelete('CASCADE');

    table.text('description').notNullable();
    table.decimal('quantity', 10, 2).notNullable(); // e.g., 1.5 hours
    table.bigInteger('unit_price_cents').notNullable();
    table.bigInteger('total_cents').notNullable();
    table.integer('position').notNullable().defaultTo(0); // For ordering items

    // Timestamps
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('invoice_id');
    table.index(['invoice_id', 'position']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('invoice_items');
}
