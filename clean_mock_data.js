const { Pool } = require('pg');
require('dotenv').config();

const connStr = process.env.DATABASE_URL;
let cleanConnStr = connStr.replace(/sslmode=[^&]*/g, '')
                        .replace(/\?&/, '?')
                        .replace(/&&/g, '&')
                        .replace(/[?&]$/, '');

if (cleanConnStr.includes(':6543')) {
    const separator = cleanConnStr.includes('?') ? '&' : '?';
    if (!cleanConnStr.includes('prepare_threshold')) {
        cleanConnStr += `${separator}prepare_threshold=0`;
    }
}

const pool = new Pool({
    connectionString: cleanConnStr,
    ssl: { rejectUnauthorized: false }
});

async function cleanMockData() {
    const client = await pool.connect();
    try {
        console.log('--- Cleaning all mock items from database ---');

        await client.query(`
            -- Delete all mock transactional and inventory data
            DELETE FROM sales_invoice_items;
            DELETE FROM sales_invoices;
            DELETE FROM proforma_invoice_items;
            DELETE FROM proforma_invoices;
            DELETE FROM company_transactions;
            DELETE FROM refunds;
            DELETE FROM transactions;
            DELETE FROM customer_payments;
            DELETE FROM customer_ledger;
            DELETE FROM shelf_movements;
            DELETE FROM shelf_inventory;
            DELETE FROM inventory_audit_log;
            DELETE FROM stock_adjustments;
            DELETE FROM stock_take_items;
            DELETE FROM stock_takes;
            DELETE FROM stock_transfer_items;
            DELETE FROM stock_transfers;
            DELETE FROM reorder_alerts;
            DELETE FROM goods_received;
            DELETE FROM purchase_order_items;
            DELETE FROM purchase_orders;
            DELETE FROM price_list_items;
            DELETE FROM product_batches;
            DELETE FROM products;
            DELETE FROM categories;
            DELETE FROM suppliers;
            DELETE FROM promotions;
            DELETE FROM promotion_usage;
            DELETE FROM shifts;
            DELETE FROM expenses;
            DELETE FROM activity_logs;

            -- Reset serial sequences
            ALTER SEQUENCE IF EXISTS products_id_seq RESTART WITH 1;
            ALTER SEQUENCE IF EXISTS product_batches_id_seq RESTART WITH 1;
            ALTER SEQUENCE IF EXISTS categories_id_seq RESTART WITH 1;
            ALTER SEQUENCE IF EXISTS suppliers_id_seq RESTART WITH 1;
            ALTER SEQUENCE IF EXISTS transactions_id_seq RESTART WITH 1;
            ALTER SEQUENCE IF EXISTS purchase_orders_id_seq RESTART WITH 1;
            ALTER SEQUENCE IF EXISTS purchase_order_items_id_seq RESTART WITH 1;
        `);

        console.log('✅ All mock inventory, products, batches, and transactions have been removed!');

        // Check products count
        const prodCount = await client.query('SELECT COUNT(*) FROM products');
        const batchCount = await client.query('SELECT COUNT(*) FROM product_batches');
        console.log('Products remaining:', prodCount.rows[0].count);
        console.log('Batches remaining:', batchCount.rows[0].count);

    } catch (err) {
        console.error('Error cleaning mock data:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

cleanMockData();
