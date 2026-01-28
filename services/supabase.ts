import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azwvdrjqrxeozfdgbarq.supabase.co';
const supabaseKey = 'sb_publishable_6julfwp5T8UBpPg6OATZKg_o9Cd7IBO';

// Inicializando o cliente real do Supabase com as credenciais fornecidas
export const supabase = createClient(supabaseUrl, supabaseKey);