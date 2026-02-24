import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// 1. Manually parse .env file
const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        env[match[1]] = match[2].replace(/^['"](.*)['"]$/, '$1');
    }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
    process.exit(1);
}

// 2. Initialize Supabase Client with the ANON key (simulating a public/unauthenticated request without JWT)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRLS() {
    console.log("=========================================");
    console.log("   TESTING SUPABASE RLS POLICIES");
    console.log("=========================================\n");

    try {
        // --- TEST 1: Read Users ---
        console.log("[Test 1] Attempting to READ from 'users' table...");
        const { data: users, error: readError } = await supabase.from('users').select('email').limit(1);

        if (readError) {
            console.error("❌ Read failed:", readError.message);
        } else {
            console.log(`✅ Read successful. Public read access works as intended. Found ${users.length} users.`);

            if (users.length > 0) {
                const targetEmail = users[0].email;

                // --- TEST 2: Update User ---
                console.log(`\n[Test 2] Malicious attempt to UPDATE user '${targetEmail}'...`);
                // We do a .select() at the end to see what was modified.
                const { data: updateData, error: updateError } = await supabase
                    .from('users')
                    .update({ role: 'hacker_admin' }) // Attempting to escalate privileges
                    .eq('email', targetEmail)
                    .select();

                if (updateError) {
                    console.log(`✅ Blocked by Database Security Rules: ${updateError.message}`);
                } else if (!updateData || updateData.length === 0) {
                    console.log("✅ Blocked by RLS policies! No rows were modified as the anonymous token didn't match the row's email.");
                } else {
                    console.error("❌ VULNERABILITY FOUND: Was able to update user!", updateData);
                }
            } else {
                console.log("\n[Test 2] Skipped (No users found in database to update)");
            }
        }

        // --- TEST 3: Insert Fake User ---
        console.log("\n[Test 3] Malicious attempt to INSERT a fake admin user...");
        const { data: insertData, error: insertError } = await supabase
            .from('users')
            .insert([{ email: 'attacker@example.com', name: 'Attacker', code: 'ATTACKER' }])
            .select();

        if (insertError) {
            console.log("✅ Insert blocked by Database Security/RLS policies.");
        } else if (!insertData || insertData.length === 0) {
            console.log("✅ Insert blocked by RLS policies! No rows were inserted.");
        } else {
            console.error("❌ VULNERABILITY FOUND: Was able to insert a fake record!", insertData);
        }

        // --- TEST 4: Update Spins ---
        console.log("\n[Test 4] Malicious attempt to UPDATE all existing spins to 'delivered' status...");
        const { data: spinUpdateData, error: spinUpdateError } = await supabase
            .from('spins')
            .update({ status: 'delivered' })
            .neq('status', 'test') // Blanket condition to target rows
            .select();

        if (spinUpdateError) {
            console.log(`✅ Blocked by Database Security Rules.`);
        } else if (!spinUpdateData || spinUpdateData.length === 0) {
            console.log("✅ Blocked by RLS policies! No spin records were modified.");
        } else {
            console.error(`❌ VULNERABILITY FOUND: Was able to update ${spinUpdateData.length} spin records!`, spinUpdateData);
        }

    } catch (err) {
        console.error("Test script encountered an unexpected runtime error:", err);
    }

    console.log("\n=========================================");
    console.log("               TEST COMPLETE");
    console.log("=========================================\n");
}

testRLS();
