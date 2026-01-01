import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('invoice_id').notNullable().references('id').inTable('invoices').onDelete('RESTRICT');

    table.bigInteger('amount_cents').notNullable();
    table.date('payment_date').notNullable();

    table.enum('payment_method', ['bank_transfer', 'check', 'cash', 'credit_card', 'other'])
      .notNullable()
      .defaultTo('bank_transfer');

    table.string('reference_number', 100).nullable();
    table.text('notes').nullable();

    // Timestamps
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('invoice_id');
    table.index('payment_date');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('payments');
}
