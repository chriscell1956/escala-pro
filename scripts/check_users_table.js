import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkUsers() {
  console.log("Checking 'usuarios' and 'users' tables...");

  const { data: u1, error: e1 } = await supabase
    .from("usuarios")
    .select("*")
    .limit(1);
  const { data: u2, error: e2 } = await supabase
    .from("users")
    .select("*")
    .limit(1);

  if (e1) console.log("Table 'usuarios': Error/Not Found");
  else console.log(`Table 'usuarios': Found, ${u1.length} rows sample.`);

  if (e2) console.log("Table 'users': Error/Not Found");
  else console.log(`Table 'users': Found, ${u2.length} rows sample.`);

  // Also check 'log_escala' as it was mentioned in truncation
  const { data: logs, error: e3 } = await supabase
    .from("log_escala")
    .select("*")
    .limit(1);
  if (e3) console.log("Table 'log_escala': Not Found");
  else console.log("Table 'log_escala': Found");
}

checkUsers();
