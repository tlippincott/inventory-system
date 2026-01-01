import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('invoices', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.string('invoice_number', 100).notNullable().unique();
    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('RESTRICT');

    // Dates
    table.date('issue_date').notNullable();
    table.date('due_date').notNullable();

    // Status
    table.enum('status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']).notNullable().defaultTo('draft');

    // Money fields (stored in cents)
    table.bigInteger('subtotal_cents').notNullable().defaultTo(0);
    table.decimal('tax_rate', 5, 2).notNullable().defaultTo(0); // e.g., 8.50 for 8.5%
    table.bigInteger('tax_amount_cents').notNullable().defaultTo(0);
    table.bigInteger('total_cents').notNullable().defaultTo(0);

    // Currency
    table.string('currency', 3).notNullable().defaultTo('USD');

    // Additional fields
    table.text('notes').nullable();
    table.text('terms').nullable();
    table.string('pdf_path', 500).nullable();

    // Timestamps
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('client_id');
    table.index('status');
    table.index('issue_date');
    table.index('due_date');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('invoices');
}
