import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase URL or Anon Key");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Default prizes structure to ensure consistency
const DEFAULT_PRIZES_STRUCTURE = [
    { id: '50k', label: '50,000 VNĐ', stock: 0, color: '#FFD700', text: '#D2042D', probability: 0.4 },
    { id: '100k', label: '100,000 VNĐ', stock: 0, color: '#FFFDD0', text: '#D2042D', probability: 0.3 },
    { id: '200k', label: '200,000 VNĐ', stock: 0, color: '#FFD700', text: '#D2042D', probability: 0.2 },
    { id: '500k', label: '500,000 VNĐ', stock: 0, color: '#FFFDD0', text: '#D2042D', probability: 0.1 },
];

interface UserData {
    name: string;
    picture?: string;
    email: string;
}

export const getUserState = async (email: string, userData: UserData) => {
    try {
        // 1. Check if user exists
        const { data: fetchedUser, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        let user = fetchedUser;

        if (error && error.code === 'PGRST116') {
            // User not found, create new
            console.log("Creating new user:", email);
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert([{
                    email: email,
                    name: userData.name,
                    avatar_url: userData.picture,
                    role: 'user',
                    has_played: false,
                    settings: { prizes: DEFAULT_PRIZES_STRUCTURE }
                }])
                .select()
                .single();

            if (createError) throw createError;
            user = newUser;
        } else if (error) {
            throw error;
        } else {
            // User exists, check if info needs update
            if (user.avatar_url !== userData.picture || user.name !== userData.name) {
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        avatar_url: userData.picture,
                        name: userData.name
                    })
                    .eq('email', email);

                if (!updateError) {
                    user.avatar_url = userData.picture;
                    user.name = userData.name;
                }
            }
        }

        // Normalize prizes: Ensure 50k, 100k, 200k, 500k exist
        if (user && user.settings) {
            const currentPrizes = user.settings.prizes || [];
            const newPrizes = [...DEFAULT_PRIZES_STRUCTURE];

            // Map current stock to default structure
            const mergedPrizes = newPrizes.map(defPrize => {
                const existing = currentPrizes.find((p: { id: string }) => p.id === defPrize.id);
                if (existing) {
                    return { ...defPrize, ...existing }; // Keep existing values (stock, etc.)
                }
                return defPrize; // Use default if missing
            });

            // Update user object locally (not saving to DB yet, app will handle save if modified)
            user.settings.prizes = mergedPrizes;
        }

        return user;
    } catch (err) {
        console.error("Error in getUserState:", err);
        return null;
    }
};

// API to get Host settings by code
export const getHostByCode = async (code: string) => {
    const { data, error } = await supabase
        .from('users')
        .select('settings, name, avatar_url')
        .eq('code', code)
        .single();

    if (error) {
        console.error("Error fetching host by code:", error);
        return null;
    }
    return data;
};

// API to get recent winners/spins
export const getRecentWinners = async (code?: string, limit: number = 20) => {
    let query = supabase
        .from('spins')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (code) {
        query = query.eq('wheel_code', code);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching winners:", error);
        return [];
    }
    return data;
};

// API to get all prizes (Legacy, now inside settings)
export const getPrizes = async () => {
    // Deprecated, use user.settings.prizes
    return [];
};

// API to upload Prize Claim image
export const uploadPrizeClaim = async (file: File, spinId: string) => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${spinId}/${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from('prize-claims')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('prize-claims')
            .getPublicUrl(filePath);

        // 3. Update Spin Record
        const { error: updateError } = await supabase
            .from('spins')
            .update({
                image_url: publicUrl,
                status: 'claimed'
            })
            .eq('id', spinId);

        if (updateError) throw updateError;

        return publicUrl;
    } catch (error) {
        console.error("Error uploading prize claim:", error);
        throw error;
    }
};

// API to update spin status (delivered/claimed/pending)
export const updateSpinStatus = async (spinId: string, status: 'pending' | 'claimed' | 'delivered') => {
    try {
        const { error } = await supabase
            .from('spins')
            .update({ status })
            .eq('id', spinId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error("Error updating spin status:", error);
        throw error;
    }
};

// API to get user's pending spins (no image uploaded yet)
export const getUserPendingSpins = async (email: string) => {
    try {
        const { data, error } = await supabase
            .from('spins')
            .select('*')
            .eq('winner_email', email)
            .is('image_url', null)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching pending spins:", error);
        return [];
    }
};

// API to check if user has already played in a specific wheel
export const checkUserHasPlayed = async (email: string, wheelCode: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .from('spins')
            .select('id')
            .eq('winner_email', email)
            .eq('wheel_code', wheelCode)
            .limit(1);

        if (error) throw error;
        return data && data.length > 0;
    } catch (error) {
        console.error("Error checking if user has played:", error);
        return false;
    }
};
