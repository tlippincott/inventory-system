import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('invoices', (table) => {
    table.date('service_period_end_date').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('invoices', (table) => {
    table.dropColumn('service_period_end_date');
  });
}
